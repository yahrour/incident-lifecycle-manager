import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { PrismaModule } from "@/common/prisma/prisma.module";
import { HealthModule } from "@/modules/health/health.module";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "@/common/validation/env.schema";
import { OrganizationModule } from "@/modules/organization/organization.module";
import { OncallModule } from "@/modules/oncall/oncall.module";
import { MetricsModule } from "@/modules/metrics/metrics.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { UsersModule } from "@/modules/users/users.module";
import { InviteModule } from "@/modules/invite/invite.module";
import { IngestionModule } from "@/modules/ingestion/ingestion.module";
import { IncidentsModule } from "@/modules/incidents/incidents.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessTokenGuard } from "@/common/guards/access-token/access-token.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerMiddleware } from "@/common/middleware/logger.middleware";
import { DiscordModule } from "./modules/discord/discord.module";

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
    DiscordModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
