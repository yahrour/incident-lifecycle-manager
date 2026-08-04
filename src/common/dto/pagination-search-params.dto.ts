import { IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { PAGINATION } from "@/common/constants";

export class OffsetPaginationSearchParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit: number = PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
