import { Controller, Post, Body, Get, Patch, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateEmailDto } from "./dto/update-email.dto";
import { VerifyEmailChangeDto } from "./dto/verify-email-change.dto";
import { Public } from "@/common/decorators/public.decorator";

@Controller({
  path: "users",
  version: "1",
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get("me")
  async getProfile(@ActiveUser() user: ActiveUserData) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch("me")
  async updateProfile(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch("me/email")
  async updateEmail(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: UpdateEmailDto
  ) {
    return this.usersService.updateEmail(user.sub, dto);
  }

  @Public()
  @Get("verify-email-change")
  async verifyEmailChange(@Query() query: VerifyEmailChangeDto) {
    return this.usersService.verifyEmailChange(query.token);
  }
}
