import {
  IsDate,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
} from "class-validator";

export class CreateUnavailabilityDto {
  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsTimeZone()
  timezone: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Reason must be 255 characters or fewer",
  })
  reason?: string;
}
