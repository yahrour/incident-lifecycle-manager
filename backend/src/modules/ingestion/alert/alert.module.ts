import { Module } from "@nestjs/common";
import { AlertController } from "./alert.controller";
import { AlertService } from "./alert.service";
import { DatadogAdapter } from "./providers/datadog/datadog.adapter";

@Module({
  controllers: [AlertController],
  providers: [AlertService, DatadogAdapter],
})
export class AlertModule {}
