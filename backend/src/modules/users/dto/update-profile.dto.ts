// update-profile.dto.ts
import { IsOptional, IsString, IsNotEmpty, IsTimeZone } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone?: string;
}
