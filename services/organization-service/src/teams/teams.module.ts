import { Module } from "@nestjs/common";
import { TeamsController } from "./controllers/teams.controller";
import { TeamsService } from "./services/teams.service";
import { MembersController } from "./controllers/members.controller";
import { MembersService } from "./services/members.service";
import { OnCallController } from "./controllers/oncall.controller";
import { OnCallService } from "./services/oncall.service";
import { UnavailabilityController } from "./controllers/unavailability.controller";
import { UnavailabilityService } from "./services/unavailability.service";

@Module({
  controllers: [
    TeamsController,
    UnavailabilityController,
    MembersController,
    OnCallController,
  ],
  providers: [
    TeamsService,
    UnavailabilityService,
    MembersService,
    OnCallService,
  ],
  exports: [OnCallService],
})
export class TeamsModule {}
