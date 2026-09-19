import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class ForgotPasswordDto {
  @Trim()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
