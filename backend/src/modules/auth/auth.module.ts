import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { GoogleAuthController } from "./google/google-auth.controller";
import { GoogleAuthService } from "./google/google-auth.service";
import { UsersModule } from "../users/users.module";
import { SecurityModule } from "../security/security.module"; // adjust path/alias
import { MailModule } from "@/common/mail/mail.module";

@Module({
  imports: [SecurityModule, UsersModule, JwtModule.register({}), MailModule],
  providers: [AuthService, GoogleAuthService],
  exports: [JwtModule],
  controllers: [AuthController, GoogleAuthController],
})
export class AuthModule {}
