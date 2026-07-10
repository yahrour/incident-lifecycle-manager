import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from "class-validator";
import { Role } from "@prisma/client";

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  specialty?: string;
}
