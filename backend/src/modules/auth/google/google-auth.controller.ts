import {
  Body,
  Controller,
  Post,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { GoogleAuthService } from "./google-auth.service";
import { Public } from "@/common/decorators/public.decorator";
import { GoogleToken } from "../dto/google-token.dto";
import type { Response } from "express";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../auth-cookie.constants";

@Controller({
  path: "auth/google",
  version: "1",
})
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post()
  async authentificate(
    @Res({ passthrough: true }) response: Response,
    @Body() googleToken: GoogleToken
  ) {
    const { accessToken, refreshToken } =
      await this.googleAuthService.authenticate(googleToken.token);
    response.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    response.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    return { success: true };
  }
}
