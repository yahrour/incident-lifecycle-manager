import { Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "./common/validation/env.schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    PrismaModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
