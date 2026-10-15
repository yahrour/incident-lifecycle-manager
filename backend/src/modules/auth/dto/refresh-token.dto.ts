import { MaxLength, IsOptional, IsString } from "class-validator";

export class RefrechTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  refreshToken?: string;
}
