import { Trim } from "@/common/transformers/trim.transformer";
import {
  IsByteLength,
  IsNotEmpty,
  IsString,
  IsTimeZone,
  MaxLength,
  MinLength,
} from "class-validator";
import { AcceptInviteDto } from "./accept-invite.dto";

export class RegisterViaInviteDto extends AcceptInviteDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  password: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  specialty: string;

  @IsString()
  @IsTimeZone()
  timezone: string = "UTC";
}
