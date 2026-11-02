import { Req, Controller, Get } from "@nestjs/common";
import { OrganizationService } from "./organization/organization.service";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
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
  async collect(@Req() { user }: AuthRequest) {
    return apiResponse({
      organization: await this.organizationService.collectMetrics(user.sub),
    });
  }
}
