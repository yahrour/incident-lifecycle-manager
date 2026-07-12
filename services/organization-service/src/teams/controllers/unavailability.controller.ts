import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  ParseIntPipe,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { UnavailabilityService } from "../services/unavailability.service";
import { CreateUnavailabilityDto } from "../dto/create-unavailability.dto";
import { UpdateUnavailabilityDto } from "../dto";

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
    @Body() createUnavailabilityDto: CreateUnavailabilityDto,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.unavailabilityService.create(
      ownerId,
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
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.unavailabilityService.update(
      ownerId,
      teamId,
      memberId,
      unavailabilityId,
      updateUnavailabilityDto
    );
  }

  // GET member unavailabilities
  @Get(":teamId/members/:memberId/unavailabilities")
  findAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.unavailabilityService.findMemberAll(ownerId, teamId, memberId);
  }

  // GET team unavailabilities
  @Get(":teamId/unavailabilities")
  findTeamAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.unavailabilityService.findTeamAll(ownerId, teamId);
  }

  // DELETE member unavailabilities
  @Delete(":teamId/members/:memberId/unavailabilities")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAll(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.unavailabilityService.removeAll(ownerId, teamId, memberId);
  }

  // DELETE member unavailability
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":teamId/members/:memberId/unavailabilities/:unavailabilityId")
  removeOne(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Param("unavailabilityId", ParseIntPipe) unavailabilityId: number,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.unavailabilityService.removeOne(
      ownerId,
      teamId,
      memberId,
      unavailabilityId
    );
  }
}
