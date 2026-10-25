import { IsIn } from "class-validator";

type Format = "json" | "csv";
export class ExportTeamDto {
  @IsIn(["json", "csv"])
  format: Format;
}
