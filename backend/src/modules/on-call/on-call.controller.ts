import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { OnCallService } from "./on-call.service";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "teams",
  version: "1",
})
export class OnCallController {
  constructor(private readonly onCallService: OnCallService) {}

  @Get(":teamId/on-call/current")
  @Roles(Role.SRE)
  async getCurrentOnCall(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.onCallService.getCurrentOnCall(user.sub, teamId);
    return apiResponse(result);
  }

  @Get(":teamId/on-call/upcoming")
  @Roles(Role.SRE)
  async getUpcomingRotations(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.onCallService.getUpcomingRotations(
      user.sub,
      teamId
    );
    return apiResponse(result);
  }
}
