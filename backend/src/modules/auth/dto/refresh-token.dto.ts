import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RefrechTokenDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
