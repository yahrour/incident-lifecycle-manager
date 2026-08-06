import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { SecurityModule } from "../security/security.module";
import { MailModule } from "@/common/mail/mail.module";

@Module({
  imports: [SecurityModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
