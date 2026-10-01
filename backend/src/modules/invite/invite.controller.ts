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
import { AcceptInviteDto } from "./dto/accept-invite.dto";

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
    const result = await this.inviteService.createInvite(
      createInvite,
      activeUser
    );
    return apiResponse(result);
  }

  @Public()
  @Get("validate")
  async validate(@Query() dto: AcceptInviteDto) {
    const data = await this.inviteService.validateToken(dto.token);
    return apiResponse(data);
  }

  @Public()
  @Post("register")
  register(@Body() registerViaInviteDto: RegisterViaInviteDto) {
    return this.inviteService.register(registerViaInviteDto);
  }

  @Post("accept")
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @ActiveUser() activeUser: ActiveUserData
  ) {
    await this.inviteService.accept(dto.token, activeUser);
  }
}
