import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
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

  @IsOptional()
  @IsDate()
  rotationStartDate?: Date;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  escalationTimeoutMinutes?: number;
}
