import { Module } from "@nestjs/common";
import { OnCallController } from "./oncall.controller";
import { OnCallService } from "./oncall.service";
import { DiscordModule } from "@/modules/discord/discord.module";

@Module({
  imports: [DiscordModule],
  controllers: [OnCallController],
  providers: [OnCallService],
  exports: [OnCallService],
})
export class OncallModule {}
