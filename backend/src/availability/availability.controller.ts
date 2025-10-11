import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @Roles('painter')
  async create(
    @CurrentUser() user: any,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    await this.availabilityService.verifyPainterRole(user.sub);
    return this.availabilityService.create(user.sub, createAvailabilityDto);
  }

  @Get('me')
  @Roles('painter')
  async findMyAvailability(@CurrentUser() user: any) {
    await this.availabilityService.verifyPainterRole(user.sub);
    return this.availabilityService.findMyAvailability(user.sub);
  }
}
