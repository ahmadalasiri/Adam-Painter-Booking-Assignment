import { IsDateString } from 'class-validator';

export class CreateAvailabilityDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
