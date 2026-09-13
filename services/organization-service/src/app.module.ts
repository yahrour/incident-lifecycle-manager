import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./common/validation/env.validation";
import { TeamsModule } from "./teams/teams.module";
import { MetricsModule } from "./metrics/metrics.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    TeamsModule,
    MetricsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
