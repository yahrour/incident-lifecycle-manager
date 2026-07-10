import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { BcryptService } from "./bcrypt.service";

@Module({
  providers: [AuthService, BcryptService],
  exports: [BcryptService],
})
export class AuthModule {}
