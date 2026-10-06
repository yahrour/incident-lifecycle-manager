import { Module } from "@nestjs/common";
import { MembersModule } from "./members/members.module";
import { TeamsModule } from "./teams/teams.module";
import { UnavailabilityModule } from "./unavailability/unavailability.module";

@Module({
  imports: [MembersModule, UnavailabilityModule, TeamsModule],
})
export class OrganizationModule {}
