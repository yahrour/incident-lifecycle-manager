import { Body, Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { Role } from "src/generated/prisma/enums";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { IncidentsService } from "./incidents.service";

@Controller({ path: "incidents", version: "1" })
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(Role.SRE)
  create(
    @Body() createIncidentDto: CreateIncidentDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.create(user.sub, createIncidentDto);
  }

  @Post(":id/acknowledge")
  @Roles(Role.SRE)
  acknowledge(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.acknowledge(user.sub, id);
  }
}
