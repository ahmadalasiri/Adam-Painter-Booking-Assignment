import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterStartTime', async: false })
export class IsAfterStartTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(endTimeString: string, args: ValidationArguments) {
    if (!endTimeString) {
      return false;
    }

    const object = args.object as any;
    const startTimeString = object.startTime;

    if (!startTimeString) {
      return false;
    }

    const startTime = new Date(startTimeString);
    const endTime = new Date(endTimeString);

    return endTime > startTime;
  }

  defaultMessage(args: ValidationArguments) {
    return 'End time must be after start time';
  }
}

