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
import { INCIDENT_SEVERITIES, INCIDENT_STATUS } from "../constants";

export class FindIncidentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsIn(Object.values(INCIDENT_STATUS))
  status?: string;

  @IsOptional()
  @IsIn(INCIDENT_SEVERITIES)
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
