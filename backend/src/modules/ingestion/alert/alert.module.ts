import { Module } from "@nestjs/common";
import { IncidentsModule } from "@/modules/incidents/incidents.module";
import { AlertController } from "./alert.controller";
import { AlertService } from "./alert.service";
import { PrometheusAdapter } from "./providers/prometheus/prometheus.adapter";

@Module({
  imports: [IncidentsModule],
  controllers: [AlertController],
  providers: [AlertService, PrometheusAdapter],
})
export class AlertModule {}
