import { IsEmail, IsString, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class SignIn {
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}
