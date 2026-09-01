import { IsNotEmpty, IsString, IsInt, IsIn } from "class-validator";

export class CreateApiKey {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsIn([7, 30, 90, 180, 365])
  expiresInDays: number;
}
