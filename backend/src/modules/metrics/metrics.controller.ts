import { Controller, Get } from "@nestjs/common";
import { OrganizationService } from "./organization/organization.service";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "metrics",
  version: "1",
})
export class MetricsController {
  constructor(private organizationService: OrganizationService) {}
  @Get()
  @Roles(Role.SRE)
  async collect(@ActiveUser() user: ActiveUserData) {
    return apiResponse({
      organization: await this.organizationService.collectMetrics(user.sub),
    });
  }
}
