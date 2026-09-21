import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "@/generated/prisma/client";
import { Trim } from "src/common/transformers/trim.transformer";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(50)
  lastName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: "Invalid email address format" })
  @Trim()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  @Trim()
  @MaxLength(100)
  specialty?: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(64)
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string;
}
