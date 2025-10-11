import { IsDateString, Validate } from 'class-validator';
import { IsFutureDateConstraint } from '../../common/validators/is-future-date.validator';
import { IsAfterStartTimeConstraint } from '../../common/validators/is-after-start-time.validator';

export class CreateAvailabilityDto {
  @IsDateString()
  @Validate(IsFutureDateConstraint, {
    message: 'Start time must be in the future',
  })
  startTime: string;

  @IsDateString()
  @Validate(IsFutureDateConstraint, {
    message: 'End time must be in the future',
  })
  @Validate(IsAfterStartTimeConstraint, {
    message: 'End time must be after start time',
  })
  endTime: string;
}
