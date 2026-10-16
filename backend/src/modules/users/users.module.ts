import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { SecurityModule } from "../security/security.module";
import { OncallModule } from "../on-call/on-call.module";
import { UnavailabilityModule } from "../organization/unavailability/unavailability.module";

@Module({
  imports: [SecurityModule, OncallModule, UnavailabilityModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
