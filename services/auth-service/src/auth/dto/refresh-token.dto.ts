import { IsNotEmpty } from "class-validator";

export class RefrechTokenDto {
  @IsNotEmpty()
  refreshToekn: string;
}
