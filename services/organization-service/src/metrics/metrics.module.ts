import { Module } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { MetricsController } from "./metrics.controller";
import { TeamsModule } from "src/teams/teams.module";

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  imports: [TeamsModule],
})
export class MetricsModule {}
