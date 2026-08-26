import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MinLength,
} from "class-validator";

export class RegisterViaInviteDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string = "UTC";
}
