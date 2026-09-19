import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class VerifySignupEmailDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  token: string;
}
