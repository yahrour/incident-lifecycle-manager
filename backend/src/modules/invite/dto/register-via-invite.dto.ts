import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
  MinLength,
} from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class RegisterViaInviteDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(64)
  token: string;

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

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(100)
  specialty: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Trim()
  @MaxLength(64)
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string = "UTC";
}
