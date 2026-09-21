import { MaxLength, IsOptional, IsString } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class RefrechTokenDto {
  @IsOptional()
  @IsString()
  @Trim()
  @MaxLength(2048)
  refreshToken?: string;
}
