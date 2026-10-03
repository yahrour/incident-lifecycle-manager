import { IsNotEmpty, IsString, Length } from "class-validator";

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsString()
  @Length(64, 64)
  token: string;
}
