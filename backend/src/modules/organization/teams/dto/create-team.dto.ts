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
  @MaxLength(50, { message: "Team name must be 50 characters or fewer" })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Team description must be 255 characters or fewer",
  })
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
  @MaxLength(255, {
    message: "Webhook URL must be 255 characters or fewer",
  })
  webhookUrl?: string;
}
