import { IsIn, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { INCIDENT_SEVERITIES } from "../constants";
import type { IncidentSeverity } from "../constants";

export class CreateIncidentDto {
  @IsUUID()
  teamId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsIn(INCIDENT_SEVERITIES)
  severity: IncidentSeverity;
}
