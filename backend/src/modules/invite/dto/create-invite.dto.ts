import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateInvite {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsNotEmpty()
  @IsEmail()
  inviteEmail: string;

  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsNotEmpty()
  speaciality: string;

  @IsOptional()
  @IsInt()
  @IsIn([1, 12, 24, 48, 72, 168])
  expiresIn: number = 72;
}
