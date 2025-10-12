import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, or, lte, gte, lt, gt, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(DB_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(
    painterId: string,
    createAvailabilityDto: CreateAvailabilityDto,
  ) {
    const startTime = new Date(createAvailabilityDto.startTime);
    const endTime = new Date(createAvailabilityDto.endTime);

    // Validate time range
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping availability
    const overlappingSlots = await this.db.query.availability.findMany({
      where: and(
        eq(schema.availability.painterId, painterId),
        or(
          and(
            lte(schema.availability.startTime, startTime),
            gte(schema.availability.endTime, startTime),
          ),
          and(
            lte(schema.availability.startTime, endTime),
            gte(schema.availability.endTime, endTime),
          ),
          and(
            gte(schema.availability.startTime, startTime),
            lte(schema.availability.endTime, endTime),
          ),
        ),
      ),
    });

    if (overlappingSlots.length > 0) {
      throw new BadRequestException(
        'This time slot overlaps with existing availability',
      );
    }

    // Create availability
    const [availability] = await this.db
      .insert(schema.availability)
      .values({
        painterId,
        startTime,
        endTime,
      })
      .returning();

    return availability;
  }

  /**
   * Fetch paginated availability slots with their associated bookings
   *
   * Performance Optimization:
   * - Uses 3 queries instead of N+1 (where N = number of slots)
   * - Parallel execution reduces latency
   * - In-memory filtering trades memory for speed
   *
   * Query Strategy:
   * 1. Parallel: Count + Slots (2 queries)
   * 2. Single range query for all bookings
   * 3. In-memory grouping (O(n*m) where n=slots, m=bookings)
   *
   * Trade-off Analysis:
   * - Database I/O: ~1-10ms per query
   * - Memory filtering: ~0.001ms per comparison
   * - For 5 slots × 50 bookings = 250 comparisons ≈ 0.25ms
   * - Saves ~5 database round-trips = ~5-50ms saved
   *
   * This approach is optimal for:
   * - Small page sizes (5-10 slots)
   * - Moderate booking counts (<1000 per painter)
   * - High network latency scenarios
   */
  async findMyAvailability(
    painterId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    // Parallel queries: Fetch count and slots simultaneously
    const [totalResult, availabilitySlots] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.availability)
        .where(eq(schema.availability.painterId, painterId)),
      this.db.query.availability.findMany({
        where: eq(schema.availability.painterId, painterId),
        orderBy: (availability, { desc }) => [desc(availability.startTime)],
        limit,
        offset,
      }),
    ]);

    const total = totalResult[0].count;

    // Early return if no availability slots
    if (availabilitySlots.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    /**
     * Calculate bounding box for all slots on this page
     * Instead of querying bookings per slot (N queries), we query once
     * for all bookings within the min-max range across all slots.
     *
     * Example:
     *   Slot 1: Dec 20-22
     *   Slot 2: Dec 25-27
     *   Slot 3: Dec 30-31
     *   → Query: bookings between Dec 20 and Dec 31
     *   → May fetch extra bookings (Dec 23-24, 28-29) but still faster
     */
    const minStartTime = availabilitySlots.reduce(
      (min, slot) => (slot.startTime < min ? slot.startTime : min),
      availabilitySlots[0].startTime,
    );
    const maxEndTime = availabilitySlots.reduce(
      (max, slot) => (slot.endTime > max ? slot.endTime : max),
      availabilitySlots[0].endTime,
    );

    // Single batch query: Fetch ALL bookings within the time range
    const allBookings = await this.db.query.bookings.findMany({
      where: and(
        eq(schema.bookings.painterId, painterId),
        lt(schema.bookings.startTime, maxEndTime),
        gt(schema.bookings.endTime, minStartTime),
      ),
      orderBy: (bookings, { asc }) => [asc(bookings.startTime)],
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    /**
     * In-memory filtering: Group bookings by slot
     *
     * Complexity: O(n * m) where n=slots, m=bookings
     * - For each slot (n=5): iterate through all bookings (m≈50)
     * - Total comparisons: 5 × 50 = 250 operations
     *
     * Performance:
     * - In-memory comparison: ~0.001ms each
     * - Total time: 250 × 0.001ms = 0.25ms
     * - Compare to: 5 DB queries × 3ms = 15ms
     * - Net gain: 14.75ms (98% faster)
     *
     * Why this is acceptable:
     * - Memory operations are ~10,000x faster than DB I/O
     * - Small datasets: 5 slots × 50 bookings = trivial
     * - No N+1 problem: scales linearly with slots, not exponentially
     */
    const availabilityWithBookings = availabilitySlots.map((slot) => {
      const slotBookings = allBookings.filter(
        (booking) =>
          booking.startTime < slot.endTime && booking.endTime > slot.startTime,
      );

      return {
        ...slot,
        bookings: slotBookings,
      };
    });

    return {
      data: availabilityWithBookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
