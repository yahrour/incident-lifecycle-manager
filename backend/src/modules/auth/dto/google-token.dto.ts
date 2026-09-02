import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class GoogleToken {
  @IsNotEmpty()
  token: string;
  @IsString()
  @IsOptional()
  inviteToken?: string;
}
