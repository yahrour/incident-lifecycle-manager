import { IsEmail, IsString, IsOptional, MinLength } from "class-validator";

export class SignUp {
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
