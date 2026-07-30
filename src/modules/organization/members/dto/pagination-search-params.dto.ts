import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { PAGINATION, SORT_ORDER } from "src/common/constants";
import { SORT_FIELD } from "../constants";

export class OffsetPaginationSearchParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(SORT_FIELD)
  sortField?: SORT_FIELD = SORT_FIELD.JOINED_AT;

  @IsOptional()
  @IsEnum(SORT_ORDER)
  sortOrder?: SORT_ORDER = SORT_ORDER.ASC;
}
