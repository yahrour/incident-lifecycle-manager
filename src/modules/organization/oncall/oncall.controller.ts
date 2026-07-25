import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { OnCallService } from "./oncall.service";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";

@Controller({
  path: "teams",
  version: "1",
})
export class OnCallController {
  constructor(private readonly onCallService: OnCallService) {}

  @Get(":id/oncall/current")
  @Roles(Role.SRE)
  getCurrentOnCall(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.onCallService.getCurrentOnCall(id, user.sub);
  }
}
