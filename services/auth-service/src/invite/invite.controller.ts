import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { InviteService } from "./invite.service";
import { CreateInvite } from "./dto/create-invite.dto";

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
}
