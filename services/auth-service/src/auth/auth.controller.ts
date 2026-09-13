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
import { Public } from "src/common/decorators/public.decorator";
import { RefrechTokenDto } from "./dto/refresh-token.dto";

@Public()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("sign-up")
  signUp(@Body() signUp: SignUp) {
    return this.authService.signUp(signUp);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("sign-in")
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signIn: SignIn
  ) {
    const { accessToken, refreshToken } = await this.authService.signIn(signIn);
    const isProduction = process.env.NODE_ENV === "production";
    response.cookie("refreshToken", refreshToken, {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.cookie("accessToken", accessToken, {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });
    return { message: "SignIn successful" };
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh-tokens")
  refreshTokens(
    @Req() request: Request,
    @Body() refrechTokenDto: RefrechTokenDto
  ) {
    const refreshToken =
      request.cookies?.["refreshToken"] ?? refrechTokenDto.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }
    return this.authService.refrechTokens(refreshToken);
  }
}
