import { Controller, Get, Headers } from "@nestjs/common";
import { OrganizationService } from "./organization/organization.service";

@Controller({
  path: "metrics",
  version: "1",
})
export class MetricsController {
  constructor(private organizationService: OrganizationService) {}
  @Get()
  collect(@Headers("x-user-id") ownerId: string) {
    return this.organizationService.collect(ownerId);
  }
}
