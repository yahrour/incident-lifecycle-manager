import { Controller, Get, Headers } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller({
  path: "metrics",
  version: "1",
})
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  collect(@Headers("x-user-id") ownerId: string) {
    return this.metricsService.collect(ownerId);
  }
}
