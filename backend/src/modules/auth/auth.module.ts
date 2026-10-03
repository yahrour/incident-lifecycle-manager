import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { GoogleAuthController } from "./google/google-auth.controller";
import { UsersModule } from "../users/users.module";
import { SecurityModule } from "../security/security.module";
import { PassportModule } from "@nestjs/passport";
import { GoogleStrategy } from "./google/google.strategy";

@Module({
  imports: [
    PassportModule,
    SecurityModule,
    UsersModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, GoogleStrategy],
  exports: [JwtModule],
  controllers: [AuthController, GoogleAuthController],
})
export class AuthModule {}
