import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { Role } from "src/generated/prisma/enums";
import { ActiveUser } from "../../common/decorators/active-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { ActiveUserData } from "../../common/interfaces/active-user.interface";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { FindIncidentsDto } from "./dto/find-incidents.dto";
import { IncidentsService } from "./incidents.service";

@Controller({ path: "incidents", version: "1" })
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(Role.SRE, Role.ENGINEER)
  findAll(
    @Query() query: FindIncidentsDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.findAll(user.sub, query);
  }

  @Get(":id")
  @Roles(Role.SRE, Role.ENGINEER)
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.findOne(user.sub, id);
  }

  @Post()
  @Roles(Role.SRE)
  create(
    @Body() createIncidentDto: CreateIncidentDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.create(user.sub, createIncidentDto);
  }

  @Post(":id/acknowledge")
  @Roles(Role.ENGINEER)
  acknowledge(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.acknowledge(user.sub, id);
  }

  @Post(":id/resolve")
  @Roles(Role.ENGINEER)
  resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.incidentsService.resolve(user.sub, id);
  }
}
