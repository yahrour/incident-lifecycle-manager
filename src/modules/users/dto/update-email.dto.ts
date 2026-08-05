import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateEmailDto {
  @IsNotEmpty()
  @IsEmail({}, { message: "Invalid email address format" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  email: string;
}
