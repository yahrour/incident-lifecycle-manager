import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import {
  CreateTeamDto,
  ExportTeamDto,
  OffsetPaginationSearchParams,
  UpdateTeamDto,
} from "./dto";
import { TeamsService } from "./teams.service";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "teams",
  version: "1",
})
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(Role.SRE)
  async create(
    @Body() createTeamDto: CreateTeamDto,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.teamsService.create(user.sub, createTeamDto);
    return apiResponse(result);
  }

  @Get("export")
  @Roles(Role.SRE)
  async export(
    @Query() query: ExportTeamDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return await this.teamsService.export(user.sub, query.format);
  }

  @Patch(":teamId")
  @Roles(Role.SRE)
  async update(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData,
    @Body() updateTeamDto: UpdateTeamDto
  ) {
    const result = await this.teamsService.update(
      user.sub,
      teamId,
      updateTeamDto
    );
    return apiResponse(result);
  }

  @Get()
  @Roles(Role.SRE)
  async findAllForOwner(
    @ActiveUser() user: ActiveUserData,
    @Query() query: OffsetPaginationSearchParams
  ) {
    const { teams, total } = await this.teamsService.findAllForOwner(
      user.sub,
      query
    );
    return apiResponse(teams, { total });
  }

  @Get(":teamId")
  @Roles(Role.SRE)
  async findOne(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.teamsService.findOne(user.sub, teamId);
    return apiResponse(result);
  }

  @Get(":teamId/stats")
  @Roles(Role.SRE)
  async getStats(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.teamsService.getStats(user.sub, teamId);
    return apiResponse(result);
  }

  @Delete(":teamId")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.teamsService.remove(user.sub, teamId);
  }
}
