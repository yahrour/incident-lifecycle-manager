import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { AuthService } from "./auth.service";
import type { Response, Request } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { RefrechTokenDto } from "./dto/refresh-token.dto";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  SESSION_HINT_COOKIE_OPTIONS,
} from "./auth-cookie.constants";

@Public()
@Controller({
  path: "auth",
  version: "1",
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("sign-up")
  signUp(@Body() signUp: SignUp) {
    return this.authService.signUp(signUp);
  }

  @HttpCode(HttpStatus.OK)
  @Post("sign-in")
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signIn: SignIn
  ) {
    const { accessToken, refreshToken } = await this.authService.signIn(signIn);
    response.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    response.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    response.cookie("hasSession", "1", SESSION_HINT_COOKIE_OPTIONS);
    return { message: "SignIn successful" };
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  refreshTokens(
    @Req() request: Request,
    @Body() refrechTokenDto: RefrechTokenDto
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    const refreshToken =
      cookies?.["refreshToken"] ?? refrechTokenDto.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }
    return this.authService.refrechTokens(refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    await this.authService.logout(cookies?.["refreshToken"]);

    response.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS);
    response.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
    response.clearCookie("hasSession", SESSION_HINT_COOKIE_OPTIONS);
    return { message: "Logged out successfully" };
  }
}
