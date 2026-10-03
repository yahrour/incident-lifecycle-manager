import { Trim } from "@/common/transformers/trim.transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MinLength,
} from "class-validator";
import { AcceptInviteDto } from "./accept-invite.dto";

export class RegisterViaInviteDto extends AcceptInviteDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsTimeZone({ message: "Invalid IANA time zone format." })
  timezone: string = "UTC";
}
