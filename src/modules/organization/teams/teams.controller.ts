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
} from "@nestjs/common";
import { CreateTeamDto, UpdateTeamDto } from "./dto";
import { TeamsService } from "./teams.service";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";

@Controller({
  path: "teams",
  version: "1",
})
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(Role.SRE)
  create(
    @Body() createTeamDto: CreateTeamDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.teamsService.create(user.sub, createTeamDto);
  }

  @Get()
  @Roles(Role.SRE)
  findAll(@ActiveUser() user: ActiveUserData) {
    return this.teamsService.findAll(user.sub);
  }

  @Get(":id")
  @Roles(Role.SRE)
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.teamsService.findOne(id, user.sub);
  }

  @Patch(":id")
  @Roles(Role.SRE)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData,
    @Body() updateTeamDto: UpdateTeamDto
  ) {
    return this.teamsService.update(id, user.sub, updateTeamDto);
  }

  @Delete(":id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.teamsService.remove(id, user.sub);
  }
}
