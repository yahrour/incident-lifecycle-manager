import { Module } from "@nestjs/common";
import { TeamsController } from "./controllers/teams.controller";
import { TeamsService } from "./services/teams.service";
import { MembersController } from "./controllers/members.controller";
import { MembersService } from "./services/members.service";

@Module({
  controllers: [TeamsController, MembersController],
  providers: [TeamsService, MembersService],
})
export class TeamsModule {}
