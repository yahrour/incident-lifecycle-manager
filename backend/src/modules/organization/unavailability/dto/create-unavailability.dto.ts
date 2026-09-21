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
  @MaxLength(255, { message: "reason must not exceed 255 characters" })
  reason?: string;
}
