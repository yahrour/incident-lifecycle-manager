import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { INCIDENT_SEVERITIES } from "../constants";
import type { IncidentSeverity } from "../constants";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateIncidentDto {
  @IsUUID()
  teamId: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: "title must not exceed 200 characters" })
  title: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(25, { message: "service must not exceed 25 characters" })
  service: string;

  @IsIn(INCIDENT_SEVERITIES)
  severity: IncidentSeverity;
}
