import {
  IsEmail,
  IsString,
  MaxLength,
  IsNotEmpty,
  IsTimeZone,
  IsByteLength,
  MinLength,
} from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";
import { NormalizeEmail } from "@/common/transformers/normalize-email";

export class SignUp {
  @Trim()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  firstName: string;

  @Trim()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  lastName: string;

  @NormalizeEmail()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  password: string;

  @IsString()
  @IsTimeZone()
  timezone: string = "UTC";
}
