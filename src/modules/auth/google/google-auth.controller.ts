import { Body, Controller, Post, Res } from "@nestjs/common";
import { GoogleAuthService } from "./google-auth.service";
import { Public } from "../../../common/decorators/public.decorator";
import { GoogleToken } from "../dto/google-token.dto";
import type { Response } from "express";

@Controller("authentication/google")
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}
  @Public()
  @Post()
  async authentificate(
    @Res({ passthrough: true }) response: Response,
    @Body() googleToken: GoogleToken
  ) {
    const { accessToken, refreshToken } =
      await this.googleAuthService.authentificate(googleToken.token);
    const isProduction = process.env.NODE_ENV === "production";
    response.cookie("accessToken", accessToken, {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    response.cookie("refreshToken", refreshToken, {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { message: "SignIn successful" };
  }
}
