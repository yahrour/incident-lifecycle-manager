import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import {
  PrometheusModule,
  makeHistogramProvider,
} from "@willsoto/nestjs-prometheus";
import { MonitoringController } from "./monitoring.controller";
import { HttpMetricsInterceptor } from "./http-metrics.interceptor";

@Module({
  imports: [PrometheusModule.register({ controller: MonitoringController })],
  providers: [
    makeHistogramProvider({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    }),
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class MonitoringModule {}
