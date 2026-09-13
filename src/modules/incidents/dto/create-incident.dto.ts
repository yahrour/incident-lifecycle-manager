import { IsIn, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateIncidentDto {
  @IsUUID()
  teamId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsIn(["low", "medium", "high", "critical"])
  severity: "low" | "medium" | "high" | "critical";
}
