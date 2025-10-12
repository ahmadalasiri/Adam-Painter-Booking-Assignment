import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, lte, gte, sql, or, gt, lt } from 'drizzle-orm';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  // ============================================================================
  // PUBLIC METHODS (Controller API)
  // ============================================================================

  async createBookingRequest(
    customerId: string,
    createBookingDto: CreateBookingDto,
  ) {
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(createBookingDto.endTime);

    // Validate time range
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Find painters with availability that covers the requested time
    const availablePainters = await this.findAvailablePainters(
      startTime,
      endTime,
    );

    if (availablePainters.length === 0) {
      // Find closest available slots (bonus feature)
      const recommendations = await this.findClosestAvailableSlots(
        startTime,
        endTime,
      );

      throw new NotFoundException({
        error: 'No painters are available for the requested time slot.',
        recommendations,
      });
    }

    // Select painter with most bookings (most requested)
    const selectedPainter =
      await this.selectMostRequestedPainter(availablePainters);

    // Create booking
    const [booking] = await this.db
      .insert(schema.bookings)
      .values({
        customerId,
        painterId: selectedPainter.id,
        startTime,
        endTime,
        status: 'confirmed',
      })
      .returning();

    // Fetch painter details
    const painter = await this.db.query.users.findFirst({
      where: eq(schema.users.id, selectedPainter.id),
      columns: {
        id: true,
        name: true,
      },
    });

    return {
      bookingId: booking.id,
      painter: {
        id: painter!.id,
        name: painter!.name,
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
    };
  }

  async findCustomerBookings(
    customerId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    // Parallel queries: Fetch count and bookings simultaneously
    const [totalResult, bookings] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.bookings)
        .where(eq(schema.bookings.customerId, customerId)),
      this.db.query.bookings.findMany({
        where: eq(schema.bookings.customerId, customerId),
        orderBy: (bookings, { desc }) => [desc(bookings.startTime)],
        limit,
        offset,
        with: {
          painter: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const total = totalResult[0].count;

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPainterBookings(
    painterId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    // Parallel queries: Fetch count and bookings simultaneously
    const [totalResult, bookings] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.bookings)
        .where(eq(schema.bookings.painterId, painterId)),
      this.db.query.bookings.findMany({
        where: eq(schema.bookings.painterId, painterId),
        orderBy: (bookings, { desc }) => [desc(bookings.startTime)],
        limit,
        offset,
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const total = totalResult[0].count;

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async findAvailablePainters(startTime: Date, endTime: Date) {
    // Find all availability slots that fully cover the requested time
    const availableSlots = await this.db.query.availability.findMany({
      where: and(
        lte(schema.availability.startTime, startTime),
        gte(schema.availability.endTime, endTime),
      ),
      with: {
        painter: true,
      },
    });

    // Filter out painters who already have bookings during this time
    const availablePainterIds: Array<{ id: string; name: string }> = [];

    for (const slot of availableSlots) {
      const conflictingBookings = await this.db.query.bookings.findMany({
        where: and(
          eq(schema.bookings.painterId, slot.painterId),
          or(
            and(
              lte(schema.bookings.startTime, startTime),
              gte(schema.bookings.endTime, startTime),
            ),
            and(
              lte(schema.bookings.startTime, endTime),
              gte(schema.bookings.endTime, endTime),
            ),
            and(
              gte(schema.bookings.startTime, startTime),
              lte(schema.bookings.endTime, endTime),
            ),
          ),
        ),
      });

      if (conflictingBookings.length === 0) {
        availablePainterIds.push({
          id: slot.painterId,
          name: slot.painter.name,
        });
      }
    }

    return availablePainterIds;
  }

  private async selectMostRequestedPainter(
    availablePainters: Array<{ id: string; name: string }>,
  ) {
    // Count bookings for each available painter
    const painterBookingCounts = await Promise.all(
      availablePainters.map(async (painter) => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.bookings)
          .where(eq(schema.bookings.painterId, painter.id));

        return {
          ...painter,
          bookingCount: result[0].count,
        };
      }),
    );

    // Sort by booking count descending, then by ID for tie-breaking
    painterBookingCounts.sort((a, b) => {
      if (b.bookingCount !== a.bookingCount) {
        return b.bookingCount - a.bookingCount;
      }
      return a.id.localeCompare(b.id);
    });

    return painterBookingCounts[0];
  }

  private async findClosestAvailableSlots(startTime: Date, endTime: Date) {
    const requestedDuration = endTime.getTime() - startTime.getTime();
    const now = new Date();

    // Get all availability slots
    const allSlots = await this.db.query.availability.findMany({
      with: {
        painter: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // For each availability slot, find free sub-ranges
    const freeSlots: Array<{
      painterId: string;
      painterName: string;
      startTime: Date;
      endTime: Date;
      duration: number;
      distanceFromRequested: number;
      isShorterThanRequested: boolean;
    }> = [];

    for (const slot of allSlots) {
      // Skip slots that have already ended (past availability)
      if (slot.endTime <= now) {
        continue;
      }

      // Get all bookings for this painter within this availability slot
      const bookingsInSlot = await this.db.query.bookings.findMany({
        where: and(
          eq(schema.bookings.painterId, slot.painterId),
          lt(schema.bookings.startTime, slot.endTime),
          gt(schema.bookings.endTime, slot.startTime),
        ),
        orderBy: (bookings, { asc }) => [asc(bookings.startTime)],
      });

      // Calculate free ranges within this availability slot
      const freeRanges = this.calculateFreeRanges(
        slot.startTime,
        slot.endTime,
        bookingsInSlot.map((b) => ({
          start: b.startTime,
          end: b.endTime,
        })),
      );

      // Process all free ranges (regardless of duration)
      for (const range of freeRanges) {
        // Skip ranges that have already ended
        if (range.end <= now) {
          continue;
        }

        // Adjust range start if it's in the past
        const adjustedStart = range.start < now ? now : range.start;
        const rangeDuration = range.end.getTime() - adjustedStart.getTime();

        // Only include ranges with at least 30 minutes of free time
        const minDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
        if (rangeDuration < minDuration) {
          continue;
        }

        // Calculate distance from requested start time to range start
        let distance: number;

        if (range.end <= startTime) {
          // Range is completely before requested time
          distance = startTime.getTime() - range.end.getTime();
        } else if (adjustedStart >= endTime) {
          // Range is completely after requested time
          distance = adjustedStart.getTime() - endTime.getTime();
        } else {
          // Range overlaps with requested time - use start time distance
          distance = Math.abs(adjustedStart.getTime() - startTime.getTime());
        }

        freeSlots.push({
          painterId: slot.painterId,
          painterName: slot.painter.name,
          startTime: adjustedStart,
          endTime: range.end,
          duration: rangeDuration,
          distanceFromRequested: distance,
          isShorterThanRequested: rangeDuration < requestedDuration,
        });
      }
    }

    // Sort by distance (closest first), then prioritize longer durations
    freeSlots.sort((a, b) => {
      // First sort by distance
      if (a.distanceFromRequested !== b.distanceFromRequested) {
        return a.distanceFromRequested - b.distanceFromRequested;
      }
      // If distance is same, prefer slots that can fit the full duration
      if (a.isShorterThanRequested !== b.isShorterThanRequested) {
        return a.isShorterThanRequested ? 1 : -1;
      }
      // If both are shorter or both can fit, prefer longer duration
      return b.duration - a.duration;
    });

    // Return top 10 recommendations
    return freeSlots.slice(0, 10).map((slot) => ({
      painterId: slot.painterId,
      painterName: slot.painterName,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  }

  private calculateFreeRanges(
    slotStart: Date,
    slotEnd: Date,
    bookings: Array<{ start: Date; end: Date }>,
  ): Array<{ start: Date; end: Date }> {
    if (bookings.length === 0) {
      return [{ start: slotStart, end: slotEnd }];
    }

    const freeRanges: Array<{ start: Date; end: Date }> = [];
    let currentStart = slotStart;

    // Sort bookings by start time
    const sortedBookings = [...bookings].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    for (const booking of sortedBookings) {
      // If there's a gap before this booking
      if (currentStart < booking.start) {
        // End 1 minute before the booking to avoid touching it
        const freeEnd = new Date(booking.start.getTime() - 60000); // Subtract 1 minute

        // Only add if there's meaningful free time (at least 1 minute)
        if (currentStart < freeEnd) {
          freeRanges.push({
            start: currentStart,
            end: freeEnd,
          });
        }
      }

      // Move current start to 1 minute after this booking ends
      const nextStart = new Date(booking.end.getTime() + 60000); // Add 1 minute
      currentStart = nextStart > currentStart ? nextStart : currentStart;
    }

    // Add remaining free time after last booking
    if (currentStart < slotEnd) {
      freeRanges.push({
        start: currentStart,
        end: slotEnd,
      });
    }

    return freeRanges;
  }
}
