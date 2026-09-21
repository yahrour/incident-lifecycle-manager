// update-profile.dto.ts
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsTimeZone,
  MaxLength,
} from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(50)
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Trim()
  @MaxLength(64)
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone?: string;
}
