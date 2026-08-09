import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from "class-validator";

export class CreateApiKey {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;
}
