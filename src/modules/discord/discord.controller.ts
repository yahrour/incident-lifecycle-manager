import { Controller, Get, Query, Res } from "@nestjs/common";
import { DiscordService } from "./discord.service";
import type { Response } from "express";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import { ConfigService } from "@nestjs/config";

@Controller("discord")
export class DiscordController {
  constructor(
    private discordAuthService: DiscordService,
    private readonly configService: ConfigService
  ) {}
  @Get("redirect")
  redirect(@Res() res: Response) {
    const authorizeUrl = this.discordAuthService.buildAuthorizeUrl();
    res.redirect(authorizeUrl);
  }

  @Get("callback")
  async callback(
    @Query("code") code: string,
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response
  ) {
    await this.discordAuthService.linkAccount(activeUser.sub, code);
    res.redirect(
      `${this.configService.get("FRONTEND_URL")}/settings?discord=connected`
    );
  }
}
