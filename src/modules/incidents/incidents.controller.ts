import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { Role } from "@/generated/prisma/enums";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { apiResponse } from "@/common/utils/api-response";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { FindIncidentsDto } from "./dto/find-incidents.dto";
import { IncidentsService } from "./incidents.service";

@Controller({ path: "incidents", version: "1" })
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(Role.SRE, Role.ENGINEER)
  async findAll(
    @Query() query: FindIncidentsDto,
    @ActiveUser() user: ActiveUserData
  ) {
    const { data, total, nextCursor } = await this.incidentsService.findAll(
      user.sub,
      query
    );

    return apiResponse(data, { total, nextCursor });
  }

  @Get(":id")
  @Roles(Role.SRE, Role.ENGINEER)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const incident = await this.incidentsService.findOne(user.sub, id);
    return apiResponse(incident);
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
  async acknowledge(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const incident = await this.incidentsService.acknowledge(user.sub, id);
    return apiResponse(incident);
  }

  @Post(":id/resolve")
  @Roles(Role.ENGINEER)
  async resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const incident = await this.incidentsService.resolve(user.sub, id);
    return apiResponse(incident);
  }
}
