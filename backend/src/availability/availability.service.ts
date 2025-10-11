import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, or, lte, gte, sql } from 'drizzle-orm';
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

    // Get total count
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.availability)
      .where(eq(schema.availability.painterId, painterId));
    const total = totalResult[0].count;

    // Get paginated availability
    const availabilitySlots = await this.db.query.availability.findMany({
      where: eq(schema.availability.painterId, painterId),
      orderBy: (availability, { asc }) => [asc(availability.startTime)],
      limit,
      offset,
    });

    return {
      data: availabilitySlots,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyPainterRole(userId: string): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user || user.role !== 'painter') {
      throw new ForbiddenException('Only painters can manage availability');
    }
  }
}
