import { Body, Controller, Post } from "@nestjs/common";
import { GoogleAuthService } from "./google-auth.service";
import { Public } from "../../common/decorators/public.decorator";
import { GoogleToken } from "../dto/google-token.dto";

@Controller("authentication/google")
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}
  @Public()
  @Post()
  authentificate(@Body() googleToken: GoogleToken) {
    return this.googleAuthService.authentificate(googleToken.token);
  }
}
