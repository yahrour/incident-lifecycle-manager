import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class VerifyEmailChangeDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(64)
  token: string;
}
