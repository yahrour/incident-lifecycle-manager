import { IsNotEmpty } from "class-validator";

export class GoogleToken {
  @IsNotEmpty()
  token: string;
}
