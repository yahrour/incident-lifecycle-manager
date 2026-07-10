import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TeamsService } from "../services/teams.service";
import { CreateTeamDto, UpdateTeamDto } from "../dto";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(
    @Headers("x-user-id") ownerId: string,
    @Body() createTeamDto: CreateTeamDto
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.teamsService.create(ownerId, createTeamDto);
  }

  @Get()
  findAll(@Headers("x-user-id") ownerId: string) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.teamsService.findAll(ownerId);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.teamsService.findOne(id, ownerId);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-user-id") ownerId: string,
    @Body() updateTeamDto: UpdateTeamDto
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.teamsService.update(id, ownerId, updateTeamDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.teamsService.remove(id, ownerId);
  }
}
