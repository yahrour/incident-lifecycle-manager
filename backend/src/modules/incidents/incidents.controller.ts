import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
} from "@nestjs/common";
import { Role } from "@/generated/prisma/enums";
import { Roles } from "@/common/decorators/roles.decorator";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
import { apiResponse } from "@/common/utils/api-response";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { FindIncidentsDto } from "./dto/find-incidents.dto";
import { CreateIncidentNoteDto } from "./dto/create-incident-note.dto";
import { IncidentsService } from "./incidents.service";
import { ReassignIncidentDto } from "./dto/reassign-incident.dto";

@Controller({ path: "incidents", version: "1" })
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(Role.SRE, Role.ENGINEER)
  async findAll(
    @Query() query: FindIncidentsDto,
    @Req() { user }: AuthRequest
  ) {
    const { data, total, nextCursor } = await this.incidentsService.findAll(
      user.sub,
      query
    );

    return apiResponse(data, { total, nextCursor });
  }

  @Sse("events")
  @Roles(Role.SRE, Role.ENGINEER)
  events(@Req() { user }: AuthRequest) {
    return this.incidentsService.events(user.sub);
  }

  @Get(":id")
  @Roles(Role.SRE, Role.ENGINEER)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() { user }: AuthRequest
  ) {
    const incident = await this.incidentsService.findOne(user.sub, id);
    return apiResponse(incident);
  }

  @Post(":id/notes")
  @Roles(Role.SRE, Role.ENGINEER)
  async createNote(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() createIncidentNoteDto: CreateIncidentNoteDto,
    @Req() { user }: AuthRequest
  ) {
    const note = await this.incidentsService.createNote(
      user.sub,
      id,
      createIncidentNoteDto.content
    );
    return apiResponse(note);
  }

  @Post()
  @Roles(Role.SRE)
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @Req() { user }: AuthRequest
  ) {
    const incident = await this.incidentsService.create(
      user.sub,
      createIncidentDto
    );
    return apiResponse(incident);
  }

  @Patch(":id/assignee")
  @Roles(Role.SRE)
  async reassign(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() reassignIncidentDto: ReassignIncidentDto,
    @Req() { user }: AuthRequest
  ) {
    const incident = await this.incidentsService.reassign(
      user.sub,
      id,
      reassignIncidentDto.assigneeId,
      reassignIncidentDto.note
    );
    return apiResponse(incident);
  }

  @Post(":id/acknowledge")
  @Roles(Role.ENGINEER)
  async acknowledge(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() { user }: AuthRequest
  ) {
    const incident = await this.incidentsService.acknowledge(user.sub, id);
    return apiResponse(incident);
  }

  @Post(":id/resolve")
  @Roles(Role.ENGINEER)
  async resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() { user }: AuthRequest
  ) {
    const incident = await this.incidentsService.resolve(user.sub, id);
    return apiResponse(incident);
  }
}
