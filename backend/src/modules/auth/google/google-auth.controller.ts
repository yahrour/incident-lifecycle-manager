import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { GoogleAuthService } from "./google-auth.service";
import { GoogleProfile } from "./google.strategy";

@Public()
@Controller({ path: "auth/google", version: "1" })
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}
  // The guard redirects to Google, so this body never runs
  @Get()
  @UseGuards(AuthGuard("google"))
  start() {}

  // The guard has already exchanged the code; the profile is on req.user
  @Get("callback")
  @UseGuards(AuthGuard("google"))
  async callback(@Req() req: Request) {
    const user = await this.googleAuthService.findOrCreateUser(
      req.user as GoogleProfile
    );
    return { id: user.id, email: user.email };
  }
}
