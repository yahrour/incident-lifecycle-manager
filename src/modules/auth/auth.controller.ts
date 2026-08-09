import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { AuthService } from "./auth.service";
import type { Response, Request, CookieOptions } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { RefrechTokenDto } from "./dto/refresh-token.dto";
import { VerifySignupEmailDto } from "./dto/verify-signup-email.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";

const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

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
    response.cookie("refreshToken", refreshToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.cookie("accessToken", accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
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

  @Public()
  @Get("verify-email")
  async verifyEmail(@Query() dto: VerifySignupEmailDto) {
    return this.authService.verifySignupEmail(dto.token);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    await this.authService.logout(cookies?.["refreshToken"]);

    response.clearCookie("accessToken", AUTH_COOKIE_OPTIONS);
    response.clearCookie("refreshToken", AUTH_COOKIE_OPTIONS);
    return { message: "Logged out successfully" };
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // @Public() @HttpCode(HttpStatus.OK)
  // @Post("reset-password")
  // async resetPassword(@Body() dto: ResetPasswordDto) {
  //   return this.authService.resetPassword(dto.token, dto.newPassword);
  // }
}
