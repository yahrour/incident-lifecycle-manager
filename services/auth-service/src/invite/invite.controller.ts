import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { InviteService } from "./invite.service";
import { CreateInvite } from "./dto/create-invite.dto";
import { RegisterViaInviteDto } from "./dto/register-via-invite.dto";
import { ActiveUser } from "src/common/decorators/active-user.decorator";
import type { ActiveUserData } from "src/common/interfaces/active-user.interface";

@Controller("invite")
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post("create")
  saveTokenInfo(@Body() createInvite: CreateInvite) {
    return this.inviteService.createInvite(createInvite);
  }

  @Get("validate")
  vlaidate(@Query("token") token: string) {
    this.inviteService.validateToken(token);
  }
  @Post("register")
  register(@Body() registerViaInviteDto: RegisterViaInviteDto) {
    return this.inviteService.register(registerViaInviteDto);
  }

  @Post("accept")
  async acceptInvite(
    @Body("token") token: string,
    @ActiveUser() activeUser: ActiveUserData
  ) {
    return this.inviteService.accept(token, activeUser);
  }
}
