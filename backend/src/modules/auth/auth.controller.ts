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
import { ConfigService } from "@nestjs/config";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { AuthService } from "./auth.service";
import type { Response, Request } from "express";
import { Public } from "@/common/decorators/public.decorator";
import {
  baseCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "./auth-cookie.constants";
import { apiResponse } from "@/common/utils/api-response";

@Public()
@Controller({
  path: "auth",
  version: "1",
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  private setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string }
  ) {
    const accessTtl = this.configService.getOrThrow<number>(
      "JWT_ACCESS_TOKEN_TTL"
    );
    const refreshTtl = this.configService.getOrThrow<number>(
      "JWT_REFRESH_TOKEN_TTL"
    );
    response.cookie(
      "accessToken",
      tokens.accessToken,
      accessCookieOptions(accessTtl)
    );
    response.cookie(
      "refreshToken",
      tokens.refreshToken,
      refreshCookieOptions(refreshTtl)
    );
  }

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
    const result = await this.authService.signIn(signIn);
    if (!result.success) {
      return apiResponse({
        success: false,
        message: "Invalid email or password",
      });
    }
    this.setAuthCookies(response, result);
    return apiResponse({ success: true });
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const oldRefreshToken: unknown = request.cookies?.["refreshToken"];
    if (typeof oldRefreshToken !== "string" || oldRefreshToken.length === 0) {
      throw new UnauthorizedException("Invalid or expired session");
    }

    const tokens = await this.authService.refrechTokens(oldRefreshToken);
    this.setAuthCookies(response, tokens);

    return { message: "Tokens refreshed" };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    await this.authService.logout(cookies?.["refreshToken"]);
    response.clearCookie("accessToken", baseCookie);
    response.clearCookie("refreshToken", baseCookie);
  }
}
