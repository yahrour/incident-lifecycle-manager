import {
  Controller,
  Get,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  Req,
} from "@nestjs/common";
import { MembersService } from "./members.service";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { OffsetPaginationSearchParams } from "./dto";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "teams",
  version: "1",
})
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get("members")
  @Roles(Role.SRE)
  async findAllForOwner(
    @Query() query: OffsetPaginationSearchParams,
    @Req() { user }: AuthRequest
  ) {
    const { members, total } = await this.membersService.findAllForOwner(
      user.sub,
      query
    );
    return apiResponse(members, { total });
  }

  @Get(":teamId/members")
  @Roles(Role.SRE)
  async findByTeam(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Query() query: OffsetPaginationSearchParams,
    @Req() { user }: AuthRequest
  ) {
    const { members, total } = await this.membersService.findByTeam(
      user.sub,
      teamId,
      query
    );
    return apiResponse(members, { total });
  }

  @Delete(":teamId/members/:memberId")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromTeam(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Req() { user }: AuthRequest
  ) {
    await this.membersService.removeFromTeam(user.sub, teamId, memberId);
  }
}
