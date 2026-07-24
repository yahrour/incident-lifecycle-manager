import { Controller, Get } from "@nestjs/common";
import { OrganizationService } from "./organization/organization.service";
import { ActiveUser } from "../common/decorators/active-user.decorator";
import type { ActiveUserData } from "../common/interfaces/active-user.interface";

@Controller({
  path: "metrics",
  version: "1",
})
export class MetricsController {
  constructor(private organizationService: OrganizationService) {}
  @Get()
  collect(@ActiveUser() user: ActiveUserData) {
    return [{ organization: this.organizationService.collect(user.sub) }];
  }
}
