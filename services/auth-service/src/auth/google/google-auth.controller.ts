import { Body, Controller, Post } from "@nestjs/common";
import { GoogleAuthService } from "./google-auth.service";

@Controller("authentication/google")
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Post()
  authentificate(@Body() tokenDto) {
    return this.googleAuthService.authentificate(tokenDto.token);
  }
}
