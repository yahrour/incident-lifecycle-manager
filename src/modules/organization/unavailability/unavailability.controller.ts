import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { UnavailabilityService } from "./unavailability.service";
import { CreateUnavailabilityDto, UpdateUnavailabilityDto } from "./dto";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";

@Controller({
  path: "teams",
  version: "1",
})
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  // POST create an unavailability
  @Post(":teamId/members/:memberId/unavailabilities")
  @Roles(Role.SRE)
  create(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Body() createUnavailabilityDto: CreateUnavailabilityDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.create(
      user.sub,
      teamId,
      memberId,
      createUnavailabilityDto
    );
  }

  // PATCH member unavailability
  @Patch(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  @Roles(Role.SRE)
  update(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.update(
      user.sub,
      teamId,
      memberId,
      unavailabilityId,
      updateUnavailabilityDto
    );
  }

  // GET member unavailabilities
  @Get(":teamId/members/:memberId/unavailabilities")
  @Roles(Role.SRE)
  findAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.findMemberAll(user.sub, teamId, memberId);
  }

  // GET team unavailabilities
  @Get(":teamId/unavailabilities")
  @Roles(Role.SRE)
  findTeamAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.findTeamAll(user.sub, teamId);
  }

  // DELETE member unavailabilities
  @Delete(":teamId/members/:memberId/unavailabilities")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SRE)
  removeAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.removeAll(user.sub, teamId, memberId);
  }

  // DELETE member unavailability
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  @Roles(Role.SRE)
  removeOne(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.removeOne(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }
}
