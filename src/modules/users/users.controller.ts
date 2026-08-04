import { Controller, Post, Body, Get, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateEmailDto } from "./dto/update-email.dto";

@Controller({
  path: "users",
  version: "1",
})
@Controller("users")
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
    return this.usersService.updateEmail(user.sub, user.email, dto);
  }
}
