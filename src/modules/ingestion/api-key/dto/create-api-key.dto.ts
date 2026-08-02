import { IsNotEmpty, IsString } from "class-validator";

export class CreateApiKey {
  @IsString()
  @IsNotEmpty()
  name: string;
}
