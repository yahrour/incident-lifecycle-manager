import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsTimeZone,
  Max,
  MaxLength,
  MinDate,
  ValidateIf,
} from "class-validator";

export class CreateTeamDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: "name must not exceed 50 characters" })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "description must not exceed 255 characters" })
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(30, {
    message: "rotation period must not exceed 30 days",
  })
  rotationPeriodDays?: number;

  @ValidateIf(
    (o: CreateTeamDto) => o.timezone !== undefined && o.timezone !== null
  )
  @IsDate()
  @MinDate(() => new Date(), {
    message: "Rotation start date must be in the future.",
  })
  rotationStartDate?: Date;

  @ValidateIf(
    (o: CreateTeamDto) =>
      o.rotationStartDate !== undefined && o.rotationStartDate !== null
  )
  @IsTimeZone()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(1440, {
    message: "escalation timeout must not exceed 1440 minutes (24 hours)",
  })
  escalationTimeoutMinutes?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20, {
    message: "You can have a maximum of 20 services",
  })
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((v: unknown) => (typeof v === "string" ? v.trim() : v))
      : value
  )
  @IsNotEmpty({ each: true })
  @MaxLength(25, {
    each: true,
    message: "Each service must not exceed 25 characters",
  })
  @ArrayUnique(
    (service: unknown) =>
      typeof service === "string" ? service.toLowerCase() : service,
    {
      message: "Services must be unique (case-insensitive)",
    }
  )
  services: string[];
}
