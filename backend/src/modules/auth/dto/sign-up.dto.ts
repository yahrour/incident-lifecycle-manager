import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsTimeZone,
} from "class-validator";

export class SignUp {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string = "UTC";
}
