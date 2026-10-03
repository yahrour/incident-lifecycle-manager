import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { GoogleAuthService } from "./google-auth.service";
import { GoogleProfile } from "./google.strategy";
import { ConfigService } from "@nestjs/config";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../auth-cookie.constants";

@Public()
@Controller({ path: "auth/google", version: "1" })
export class GoogleAuthController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly configService: ConfigService
  ) {}
  // The guard redirects to Google, so this body never runs
  @Get()
  @UseGuards(AuthGuard("google"))
  start() {}

  // The guard has already exchanged the code; the profile is on req.user
  @Get("callback")
  @UseGuards(AuthGuard("google"))
  async callback(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const frontendUrl = this.configService.getOrThrow<string>("FRONTEND_URL");
    try {
      const result = await this.googleAuthService.login(
        req.user as GoogleProfile
      );
      if (!result.success) {
        return response.redirect(`${frontendUrl}/login?error=google`);
      }
      response.cookie(
        "refreshToken",
        result.refreshToken,
        REFRESH_COOKIE_OPTIONS
      );
      response.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
      return response.redirect(`${frontendUrl}/`);
    } catch {
      return response.redirect(`${frontendUrl}/login?error=google`);
    }
  }
}
