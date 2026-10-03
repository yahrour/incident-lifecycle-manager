import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { Public } from "@/common/decorators/public.decorator";

@Public()
@Controller({ path: "auth/google", version: "1" })
export class GoogleAuthController {
  // The guard redirects to Google, so this body never runs
  @Get()
  @UseGuards(AuthGuard("google"))
  start() {}

  // The guard has already exchanged the code; the profile is on req.user
  @Get("callback")
  @UseGuards(AuthGuard("google"))
  callback(@Req() req: Request) {
    console.log(req.user);
    return req.user;
  }
}
