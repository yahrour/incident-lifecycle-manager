import { IsString, Matches } from "class-validator";

export class AcceptInviteDto {
  @IsString()
  @Matches(/^[0-9a-f]{64}$/, {
    message: "Invalid invitation token format",
  })
  token: string;
}
