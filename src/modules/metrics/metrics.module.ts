import { Module } from "@nestjs/common";
import { OrganizationService } from "./organization/organization.service";
import { MetricsController } from "./metrics.controller";
import { OnCallService } from "../organization/oncall/oncall.service";

@Module({
  imports: [],
  providers: [OrganizationService, OnCallService],
  controllers: [MetricsController],
})
export class MetricsModule {}
