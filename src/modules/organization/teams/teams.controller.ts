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
  CursorPaginationSearchParams,
  UpdateTeamDto,
} from "./dto";
import { TeamsService } from "./teams.service";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";
import { apiResponse } from "src/common/utils/api-response";

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

  @Patch(":id")
  @Roles(Role.SRE)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData,
    @Body() updateTeamDto: UpdateTeamDto
  ) {
    const result = await this.teamsService.update(id, user.sub, updateTeamDto);
    return apiResponse(result);
  }

  @Get()
  @Roles(Role.SRE)
  async findAll(
    @ActiveUser() user: ActiveUserData,
    @Query() query: CursorPaginationSearchParams
  ) {
    const { teams, nextCursor } = await this.teamsService.findAll(
      user.sub,
      query
    );
    return apiResponse(teams, { nextCursor });
  }

  @Get(":id")
  @Roles(Role.SRE)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.teamsService.findOne(id, user.sub);
    return apiResponse(result);
  }

  @Delete(":id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.teamsService.delete(id, user.sub);
  }
}
