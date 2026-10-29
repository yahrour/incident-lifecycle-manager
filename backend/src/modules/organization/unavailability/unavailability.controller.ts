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
  Query,
  Put,
} from "@nestjs/common";
import { UnavailabilityService } from "./unavailability.service";
import { RequestUnavailabilityDto, UpdateUnavailabilityDto } from "./dto";
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

  @Post(":teamId/members/:memberId/unavailabilities")
  async request(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() requestUnavailabilityDto: RequestUnavailabilityDto
  ) {
    const result = await this.unavailabilityService.request(
      user.sub,
      teamId,
      memberId,
      requestUnavailabilityDto
    );
    return apiResponse(result);
  }

  @Put(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
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

  @Get("unavailabilities")
  @Roles(Role.SRE)
  async findAllForOwner(
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findAllForOwner(user.sub, query);
    return apiResponse(unavailabilities, { total });
  }

  @Get(":teamId/members/:memberId/unavailabilities")
  async findByMember(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findByMember(
        user.sub,
        teamId,
        memberId,
        query
      );
    return apiResponse(unavailabilities, { total });
  }

  @Delete(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.unavailabilityService.cancel(
      user.sub,
      teamId,
      memberId,
      unavailabilityId
    );
  }

  @Get(":teamId/unavailabilities")
  @Roles(Role.SRE)
  async findByTeam(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { unavailabilities, total } =
      await this.unavailabilityService.findByTeam(user.sub, teamId, query);
    return apiResponse(unavailabilities, { total });
  }

  @Post(":teamId/members/:memberId/unavailabilities/:unavailabilityId/approve")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SRE)
  async approve(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.unavailabilityService.approve(
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
