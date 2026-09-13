import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersModule } from "src/users/users.module";
import { AuthController } from "./auth.controller";
import { GoogleAuthController } from "./google/google-auth.controller";
import { GoogleAuthService } from "./google/google-auth.service";

@Module({
  imports: [UsersModule, JwtModule.register({})],
  providers: [AuthService, GoogleAuthService],
  exports: [JwtModule],
  controllers: [AuthController, GoogleAuthController],
})
export class AuthModule {}
