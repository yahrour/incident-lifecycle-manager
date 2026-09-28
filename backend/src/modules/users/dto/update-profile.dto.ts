import { Trim } from "@/common/transformers/trim.transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: "First name can't be empty." })
  @MaxLength(50, { message: "First name must be at most 50 characters." })
  firstName?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: "Last name can't be empty." })
  @MaxLength(50, { message: "Last name must be at most 50 characters." })
  lastName?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: "Specialty can't be empty." })
  @MaxLength(100, { message: "Specialty must be at most 100 characters." })
  specialty?: string;

  @IsOptional()
  @IsString()
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone?: string;
}
