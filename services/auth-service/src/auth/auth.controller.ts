import { Body, Controller, Post } from "@nestjs/common";
import { RegisterUserDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  @Post()
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.register(registerUserDto);
  }
}
