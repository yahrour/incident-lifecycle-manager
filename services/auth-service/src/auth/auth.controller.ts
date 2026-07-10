import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("sign-up")
  signUp(@Body() signUp: SignUp) {
    return this.authService.signUp(signUp);
  }

  @HttpCode(HttpStatus.OK)
  @Post("sign-in")
  signIn(@Body() signIn: SignIn) {
    return this.authService.signIn(signIn);
  }
}
