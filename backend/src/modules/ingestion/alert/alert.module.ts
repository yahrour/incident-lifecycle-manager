import { Module } from "@nestjs/common";
import { AlertController } from "./alert.controller";
import { AlertService } from "./alert.service";
import { PrometheusAdapter } from "./providers/prometheus/prometheus.adapter";

@Module({
  controllers: [AlertController],
  providers: [AlertService, PrometheusAdapter],
})
export class AlertModule {}
