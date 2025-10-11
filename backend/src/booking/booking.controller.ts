import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('booking-request')
  @Roles('customer')
  async createBookingRequest(
    @CurrentUser() user: JwtPayload,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.createBookingRequest(user.sub, createBookingDto);
  }

  @Get('bookings/me')
  @Roles('customer')
  async getMyBookings(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bookingService.findCustomerBookings(
      user.sub,
      query.page,
      query.limit,
    );
  }

  @Get('bookings/assigned')
  @Roles('painter')
  async getAssignedBookings(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bookingService.findPainterBookings(
      user.sub,
      query.page,
      query.limit,
    );
  }
}
