import { Body, Controller, Post } from "@nestjs/common";
import { InviteService } from "./invite.service";
import { CreateInvite } from "./dto/create-invite.dto";

@Controller("invite")
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post("create")
  saveToeknInfo(@Body() createInvite: CreateInvite) {
    return this.inviteService.createInvite(createInvite);
  }
}
