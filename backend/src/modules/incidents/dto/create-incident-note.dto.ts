import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateIncidentNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
