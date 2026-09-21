import { IsNotEmpty, IsString, IsOptional, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class GoogleToken {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(2048)
  token: string;

  @IsString()
  @IsOptional()
  @Trim()
  @MaxLength(64)
  inviteToken?: string;
}
