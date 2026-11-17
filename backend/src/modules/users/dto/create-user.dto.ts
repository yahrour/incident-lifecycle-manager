import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MinLength,
} from "class-validator";
import { Role } from "@/generated/prisma/client";
import { NormalizeEmail } from "@/common/transformers/normalize-email";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @NormalizeEmail()
  @IsNotEmpty()
  @IsEmail({}, { message: "Invalid email address format" })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsNotEmpty()
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string;
}
