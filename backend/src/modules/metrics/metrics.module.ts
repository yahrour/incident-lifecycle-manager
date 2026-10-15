import { Module } from "@nestjs/common";
import { OrganizationService } from "./organization/organization.service";
import { MetricsController } from "./metrics.controller";
import { OncallModule } from "@/modules/on-call/on-call.module";

@Module({
  imports: [OncallModule],
  providers: [OrganizationService],
  controllers: [MetricsController],
})
export class MetricsModule {}
