import { Module } from "@nestjs/common";
import { TeamsController } from "./controllers/teams.controller";
import { TeamsService } from "./services/teams.service";
import { MembersController } from "./controllers/members.controller";
import { MembersService } from "./services/members.service";
import { OnCallController } from "./controllers/oncall.controller";
import { OnCallService } from "./services/oncall.service";

@Module({
  controllers: [TeamsController, MembersController, OnCallController],
  providers: [TeamsService, MembersService, OnCallService],
})
export class TeamsModule {}
