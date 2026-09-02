import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsTimeZone,
  IsUrl,
  ValidateIf,
} from "class-validator";

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
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
  webhookUrl?: string;
}
