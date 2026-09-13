import { Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "./common/validation/env.schema";
import { OrganizationModule } from "./modules/organization/organization.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { InviteModule } from "./modules/invite/invite.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessTokenGuard } from "./modules/common/guards/access-token/access-token.guard";
import { RolesGuard } from "./modules/common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    AuthModule,
    InviteModule,
    UsersModule,
    PrismaModule,
    HealthModule,
    OrganizationModule,
    MetricsModule,
    IngestionModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
