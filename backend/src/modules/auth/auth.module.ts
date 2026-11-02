import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { GoogleAuthController } from "./google/google-auth.controller";
import { UsersModule } from "../users/users.module";
import { SecurityModule } from "../security/security.module";
import { PassportModule } from "@nestjs/passport";
import { GoogleStrategy } from "./google/google.strategy";
import { GoogleAuthService } from "./google/google-auth.service";
import { APP_GUARD } from "@nestjs/core";
import { AccessTokenGuard } from "@/common/guards/access-token/access-token.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@Module({
  imports: [PassportModule, SecurityModule, UsersModule, JwtModule],
  providers: [
    AuthService,
    GoogleStrategy,
    GoogleAuthService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController, GoogleAuthController],
})
export class AuthModule {}
