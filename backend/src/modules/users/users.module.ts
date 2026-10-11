import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { SecurityModule } from "../security/security.module";
import { OncallModule } from "../oncall/oncall.module";

@Module({
  imports: [SecurityModule, OncallModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
