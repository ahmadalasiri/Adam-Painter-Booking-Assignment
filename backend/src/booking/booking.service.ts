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

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

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
    // Find slots after the requested time
    const slotsAfter = await this.db.query.availability.findMany({
      where: gt(schema.availability.startTime, endTime),
      orderBy: (availability, { asc }) => [asc(availability.startTime)],
      limit: 3,
      with: {
        painter: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Find slots before the requested time
    const slotsBefore = await this.db.query.availability.findMany({
      where: lt(schema.availability.endTime, startTime),
      orderBy: (availability, { desc }) => [desc(availability.endTime)],
      limit: 3,
      with: {
        painter: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    const recommendations: Array<{
      painterId: string;
      painterName: string;
      startTime: Date;
      endTime: Date;
    }> = [];

    // Format recommendations
    for (const slot of [...slotsBefore, ...slotsAfter]) {
      recommendations.push({
        painterId: slot.painterId,
        painterName: slot.painter.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }

    return recommendations;
  }

  async findCustomerBookings(customerId: string) {
    const bookings = await this.db.query.bookings.findMany({
      where: eq(schema.bookings.customerId, customerId),
      orderBy: (bookings, { desc }) => [desc(bookings.startTime)],
      with: {
        painter: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      painter: {
        id: booking.painter.id,
        name: booking.painter.name,
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      createdAt: booking.createdAt,
    }));
  }

  async findPainterBookings(painterId: string) {
    const bookings = await this.db.query.bookings.findMany({
      where: eq(schema.bookings.painterId, painterId),
      orderBy: (bookings, { desc }) => [desc(bookings.startTime)],
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

    return bookings.map((booking) => ({
      id: booking.id,
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
        email: booking.customer.email,
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      createdAt: booking.createdAt,
    }));
  }
}
