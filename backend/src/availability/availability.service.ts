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

  async findMyAvailability(
    painterId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    // Single query: Get count + paginated availability slots
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

    // Find min/max time range for all slots on this page
    const minStartTime = availabilitySlots.reduce(
      (min, slot) => (slot.startTime < min ? slot.startTime : min),
      availabilitySlots[0].startTime,
    );
    const maxEndTime = availabilitySlots.reduce(
      (max, slot) => (slot.endTime > max ? slot.endTime : max),
      availabilitySlots[0].endTime,
    );

    // Single query: Fetch ALL bookings that overlap with ANY slot on this page
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

    // Group bookings by slot in memory (O(n*m) but fast for small datasets)
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
