import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsTimeZone,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: "name must not exceed 50 characters" })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "description must not exceed 255 characters" })
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rotationPeriodDays?: number;

  @ValidateIf(
    (o: CreateTeamDto) => o.timezone !== undefined && o.timezone !== null
  )
  @IsDate()
  rotationStartDate?: Date;

  @ValidateIf(
    (o: CreateTeamDto) =>
      o.rotationStartDate !== undefined && o.rotationStartDate !== null
  )
  @IsTimeZone()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  escalationTimeoutMinutes?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(255, { message: "webhook url must not exceed 255 characters" })
  webhookUrl?: string;
}
