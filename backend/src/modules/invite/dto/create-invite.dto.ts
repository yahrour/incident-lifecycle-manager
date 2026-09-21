import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { Trim } from "src/common/transformers/trim.transformer";

export class CreateInvite {
  @IsNotEmpty()
  @IsEmail()
  @Trim()
  @MaxLength(255)
  inviteEmail: string;

  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @MaxLength(100)
  speaciality: string;

  @IsOptional()
  @IsInt()
  @IsIn([1, 12, 24, 48, 72, 168])
  expiresIn: number = 72;
}
