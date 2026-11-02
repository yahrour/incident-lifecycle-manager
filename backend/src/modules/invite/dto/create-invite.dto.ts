import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from "class-validator";
import { NormalizeEmail } from "@/common/transformers/normalize-email";

export class CreateInvite {
  @NormalizeEmail()
  @IsNotEmpty()
  @IsEmail()
  inviteEmail: string;

  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @IsOptional()
  @IsInt()
  @IsIn([1, 12, 24, 48, 72, 168])
  expiresIn: number = 72;
}
