import { Module } from "@nestjs/common";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { MonitoringController } from "./monitoring.controller";

@Module({
  imports: [PrometheusModule.register({ controller: MonitoringController })],
})
export class MonitoringModule {}
