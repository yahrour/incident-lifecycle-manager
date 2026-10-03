import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsTimeZone,
} from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";
import { Transform } from "class-transformer";

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

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  specialty?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string = "UTC";
}
