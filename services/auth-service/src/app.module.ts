import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SecurityModule } from "./common/security/security.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessTokenGuard } from "./common/guards/access-token/access-token.guard";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, SecurityModule],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: AccessTokenGuard }],
})
export class AppModule {}
