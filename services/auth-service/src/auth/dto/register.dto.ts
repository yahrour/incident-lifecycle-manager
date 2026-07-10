//get the mainl and first name && lastNmae, password, specialty?
import { IsEmail, IsString, IsOptional, MinLength } from "class-validator";

export class RegisterUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  specialty?: string;
}
