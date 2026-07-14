import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SecurityModule } from "./common/security/security.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessTokenGuard } from "./common/guards/access-token/access-token.guard";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_TTL: Joi.number().default(3600),
        JWT_REFRESH_TOKEN_TTL: Joi.number().default(604800),
        JWT_AUDIENCE: Joi.string().required(),
        JWT_ISSUER: Joi.string().required(),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SecurityModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: AccessTokenGuard }],
})
export class AppModule {}
