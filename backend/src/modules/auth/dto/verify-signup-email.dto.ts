import { IsNotEmpty, IsString } from "class-validator";

export class VerifySignupEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
