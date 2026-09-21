import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @MaxLength(64)
  token: string;
}
