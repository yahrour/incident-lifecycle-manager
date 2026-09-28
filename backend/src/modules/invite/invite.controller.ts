import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { InviteService } from "./invite.service";
import { CreateInvite } from "./dto/create-invite.dto";
import { RegisterViaInviteDto } from "./dto/register-via-invite.dto";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "invite",
  version: "1",
})
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Roles(Role.SRE)
  @Post("create")
  async create(
    @Body() createInvite: CreateInvite,
    @ActiveUser() activeUser: ActiveUserData
  ) {
    const inviteLink = await this.inviteService.createInvite(
      createInvite,
      activeUser
    );
    return apiResponse(inviteLink);
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
