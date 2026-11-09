import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { GoogleAuthService } from "./google-auth.service";
import { GoogleProfile } from "./google.strategy";
import { ConfigService } from "@nestjs/config";
import { setAuthCookies } from "../auth-cookie.constants";
import { GoogleOAuthGuard, safeRedirect } from "./google-oauth.guard";

@Public()
@Controller({ path: "auth/google", version: "1" })
export class GoogleAuthController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly configService: ConfigService
  ) {}
  @Get()
  @UseGuards(GoogleOAuthGuard)
  redirectToGoogle() {
    // Passport handles the redirect.
  }

  @Get("callback")
  @UseGuards(GoogleOAuthGuard)
  async callback(
    @Req() req: Request,
    @Res() response: Response,
    @Query("state") state?: string
  ) {
    const frontendUrl = this.configService.getOrThrow<string>("FRONTEND_URL");
    const redirect = safeRedirect(state);
    const profile = req.user as GoogleProfile | null;
    if (!profile) {
      return response.redirect(`${frontendUrl}/login?error=google`);
    }
    try {
      const result = await this.googleAuthService.login(profile);
      if (!result.success) {
        return response.redirect(`${frontendUrl}/login?error=google`);
      }
      setAuthCookies(response, result, this.configService);
      return response.redirect(`${frontendUrl}${redirect}`);
    } catch {
      return response.redirect(`${frontendUrl}/login?error=google`);
    }
  }
}
