import { IsUUID } from "class-validator";

export class ReassignIncidentDto {
  @IsUUID()
  assigneeId: string;
}
