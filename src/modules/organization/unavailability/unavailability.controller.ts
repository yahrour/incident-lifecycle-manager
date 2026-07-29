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
  Query,
} from "@nestjs/common";
import { UnavailabilityService } from "./unavailability.service";
import { CreateUnavailabilityDto, UpdateUnavailabilityDto } from "./dto";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";
import { PaginationSearchParams } from "src/common/dto";

@Controller({
  path: "teams",
  version: "1",
})
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  // POST create an unavailability
  @Post(":teamId/members/:memberId/unavailabilities")
  create(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createUnavailabilityDto: CreateUnavailabilityDto
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
  update(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto
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
  findMemberAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Query() query: PaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.findMemberAll(
      user.sub,
      teamId,
      memberId,
      query
    );
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

  // GET pending unavailabilities
  @Get(":teamId/unavailabilities/pending")
  @Roles(Role.SRE)
  findPending(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Query() query: PaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.findPending(user.sub, teamId, query);
  }

  // POST confirm unavailability
  @Post(":teamId/members/:memberId/unavailabilities/:unavailabilityId/confirm")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SRE)
  confirm(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.confirm(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }

  // DELETE member unavailabilities
  @Delete(":teamId/members/:memberId/unavailabilities")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMemberAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.removeMemberAll(
      user.sub,
      teamId,
      memberId
    );
  }

  // DELETE member unavailability
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  removeMemberOne(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.unavailabilityService.removeMemberOne(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }
}
