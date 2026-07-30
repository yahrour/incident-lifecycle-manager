import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { PAGINATION, SORT_ORDER } from "src/common/constants";
import { SORT_FIELD } from "../constants";

export class CursorPaginationSearchParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit: number = PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsEnum(SORT_FIELD)
  sortField: SORT_FIELD = SORT_FIELD.CREATED_AT;

  @IsOptional()
  @IsEnum(SORT_ORDER)
  sortOrder: SORT_ORDER = SORT_ORDER.ASC;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;
}
