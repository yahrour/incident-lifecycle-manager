import {
  IsDate,
  IsNotEmpty,
  IsString,
  IsTimeZone,
  MaxLength,
} from "class-validator";

export class RequestUnavailabilityDto {
  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsTimeZone()
  timezone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: "reason must not exceed 255 characters" })
  reason: string;
}
