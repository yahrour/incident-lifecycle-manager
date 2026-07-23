import { Module } from "@nestjs/common";
import { InviteController } from "./invite.controller";
import { InviteService } from "./invite.service";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [UsersModule],
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}
