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

@Module({
  imports: [
    PassportModule,
    SecurityModule,
    UsersModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, GoogleStrategy, GoogleAuthService],
  exports: [JwtModule],
  controllers: [AuthController, GoogleAuthController],
})
export class AuthModule {}
