import { IsByteLength, IsEmail, IsString, MaxLength } from "class-validator";
import { NormalizeEmail } from "@/common/transformers/normalize-email";

export class SignIn {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsByteLength(0, 72)
  password: string;
}
