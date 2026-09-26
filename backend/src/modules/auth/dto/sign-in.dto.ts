import { IsEmail, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class SignIn {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}
