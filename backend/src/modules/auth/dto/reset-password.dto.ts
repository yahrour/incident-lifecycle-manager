import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class ResetPasswordDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
