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
  rotation_period_days?: number;

  @IsOptional()
  @IsDate()
  rotation_start_date?: Date;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  escalation_timeout_minutes?: number;
}
