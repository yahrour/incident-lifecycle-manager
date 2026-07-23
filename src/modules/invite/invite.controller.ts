import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { InviteService } from "./invite.service";
import { CreateInvite } from "./dto/create-invite.dto";
import { RegisterViaInviteDto } from "./dto/register-via-invite.dto";
import { ActiveUser } from "../common/decorators/active-user.decorator";
import type { ActiveUserData } from "../common/interfaces/active-user.interface";
import { Public } from "../common/decorators/public.decorator";

@Controller({
  path: "invite",
  version: "1",
})
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post("create")
  create(@Body() createInvite: CreateInvite) {
    return this.inviteService.createInvite(createInvite);
  }

  @Public()
  @Get("validate")
  validate(@Query("token") token: string) {
    return this.inviteService.validateToken(token);
  }

  @Public()
  @Post("register")
  register(@Body() registerViaInviteDto: RegisterViaInviteDto) {
    return this.inviteService.register(registerViaInviteDto);
  }

  @Post("accept")
  acceptInvite(
    @Body("token") token: string,
    @ActiveUser() activeUser: ActiveUserData
  ) {
    return this.inviteService.accept(token, activeUser);
  }
}
