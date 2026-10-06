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
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { OffsetPaginationSearchParams } from "./dto";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "teams",
  version: "1",
})
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  @Get("unavailabilities")
  @Roles(Role.SRE)
  async findAll(
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findAll(user.sub, query);
    return apiResponse(unavailabilities, { total });
  }

  @Get("unavailabilities/pending")
  @Roles(Role.SRE)
  async findPending(
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findPending(user.sub, query);
    return apiResponse(unavailabilities, { total });
  }

  @Post(":teamId/members/:memberId/unavailabilities")
  async create(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createUnavailabilityDto: CreateUnavailabilityDto
  ) {
    const result = await this.unavailabilityService.create(
      user.sub,
      teamId,
      memberId,
      createUnavailabilityDto
    );
    return apiResponse(result);
  }

  @Patch(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  async update(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto
  ) {
    const result = await this.unavailabilityService.update(
      user.sub,
      teamId,
      memberId,
      unavailabilityId,
      updateUnavailabilityDto
    );
    return apiResponse(result);
  }

  @Get(":teamId/members/:memberId/unavailabilities")
  async findMemberAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findMemberAll(
        user.sub,
        teamId,
        memberId,
        query
      );
    return apiResponse(unavailabilities, { total });
  }

  @Delete(":teamId/members/:memberId/unavailabilities")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.unavailabilityService.removeMemberAll(
      user.sub,
      teamId,
      memberId
    );
  }

  @Delete(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberOne(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.unavailabilityService.removeMemberOne(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }

  @Get(":teamId/unavailabilities")
  @Roles(Role.SRE)
  async findTeamAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findTeamAll(user.sub, teamId, query);
    return apiResponse(unavailabilities, { total });
  }

  @Get(":teamId/unavailabilities/pending")
  @Roles(Role.SRE)
  async findTeamPending(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findTeamPending(user.sub, teamId, query);
    return apiResponse(unavailabilities, { total });
  }

  @Post(":teamId/members/:memberId/unavailabilities/:unavailabilityId/confirm")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SRE)
  async confirm(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.unavailabilityService.confirm(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }

  @Post(":teamId/members/:memberId/unavailabilities/:unavailabilityId/reject")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SRE)
  async reject(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.unavailabilityService.reject(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }
}
