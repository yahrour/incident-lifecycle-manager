import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class UpdateEmailDto {
  @IsNotEmpty()
  @IsEmail({}, { message: "Invalid email address format" })
  @Trim()
  @MaxLength(255)
  email: string;
}
