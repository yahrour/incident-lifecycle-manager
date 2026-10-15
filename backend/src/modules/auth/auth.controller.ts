import {
  Body,
  Controller,
  Get,
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
} from "./auth-cookie.constants";
import { apiResponse } from "@/common/utils/api-response";

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
    const result = await this.authService.signIn(signIn);
    if (!result.success) {
      return apiResponse({
        success: false,
        message: "Invalid email or password",
      });
    }
    response.cookie(
      "refreshToken",
      result.refreshToken,
      REFRESH_COOKIE_OPTIONS
    );
    response.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    return apiResponse({ success: true });
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  async refreshTokens(
    @Req() request: Request,
    @Body() refrechTokenDto: RefrechTokenDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    const oldRefreshToken =
      cookies?.["refreshToken"] ?? refrechTokenDto.refreshToken;
    if (!oldRefreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const { accessToken, refreshToken } =
      await this.authService.refrechTokens(oldRefreshToken);

    response.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    response.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);

    return { message: "Tokens refreshed" };
  }

  @Get("session")
  async session(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;

    const { user, tokens } = await this.authService.getSession(
      cookies?.["accessToken"],
      cookies?.["refreshToken"]
    );

    if (tokens) {
      response.cookie(
        "refreshToken",
        tokens.refreshToken,
        REFRESH_COOKIE_OPTIONS
      );
      response.cookie("accessToken", tokens.accessToken, ACCESS_COOKIE_OPTIONS);
    }

    return { user };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    await this.authService.logout(cookies?.["refreshToken"]);
    response.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS);
    response.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  }
}
