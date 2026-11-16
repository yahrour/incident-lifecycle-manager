import { Module } from "@nestjs/common";
import { PrismaModule } from "@/common/prisma/prisma.module";
import { HealthModule } from "@/modules/health/health.module";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "@/common/validation/env.schema";
import { OrganizationModule } from "@/modules/organization/organization.module";
import { OncallModule } from "@/modules/on-call/on-call.module";
import { MetricsModule } from "@/modules/metrics/metrics.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { UsersModule } from "@/modules/users/users.module";
import { InviteModule } from "@/modules/invite/invite.module";
import { IngestionModule } from "@/modules/ingestion/ingestion.module";
import { IncidentsModule } from "@/modules/incidents/incidents.module";
import { ScheduleModule } from "@nestjs/schedule";
import { MonitoringModule } from "./modules/monitoring/monitoring.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    InviteModule,
    UsersModule,
    PrismaModule,
    HealthModule,
    OrganizationModule,
    OncallModule,
    MetricsModule,
    IngestionModule,
    IncidentsModule,
    MonitoringModule,
  ],
})
export class AppModule {}
