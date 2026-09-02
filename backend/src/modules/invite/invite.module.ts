import { Module } from "@nestjs/common";
import { InviteController } from "./invite.controller";
import { InviteService } from "./invite.service";
import { UsersModule } from "../users/users.module";
import { MembersModule } from "../organization/members/members.module";

@Module({
  imports: [UsersModule, MembersModule],
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}
