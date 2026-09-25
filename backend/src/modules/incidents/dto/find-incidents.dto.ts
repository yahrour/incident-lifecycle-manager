import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { PAGINATION } from "@/common/constants";

export class FindIncidentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsIn(["open", "acknowledged", "resolved"])
  status?: string;

  @IsOptional()
  @IsIn(["low", "medium", "high", "critical"])
  severity?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit = PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  cursor?: string;
}
