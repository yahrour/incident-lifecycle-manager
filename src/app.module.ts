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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
