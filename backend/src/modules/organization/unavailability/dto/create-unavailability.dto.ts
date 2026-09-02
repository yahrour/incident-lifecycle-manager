import { IsDate, IsOptional, IsString, IsTimeZone } from "class-validator";

export class CreateUnavailabilityDto {
  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsTimeZone()
  timezone: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
