import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { OnCallService } from "./oncall.service";
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

  @Get(":id/oncall/current")
  @Roles(Role.SRE)
  async getCurrentOnCall(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.onCallService.getCurrentOnCall(id, user.sub);
    return apiResponse(result);
  }

  @Get(":id/upcoming-rotations")
  @Roles(Role.SRE)
  async getUpcomingRotations(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.onCallService.getUpcomingRotations(id, user.sub);
    return apiResponse(result);
  }
}
