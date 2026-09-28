import { Controller, Post, Body, Get, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { apiResponse } from "@/common/utils/api-response";

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
    const profile = await this.usersService.getProfile(user.sub);
    return apiResponse(profile);
  }

  @Patch("me")
  async updateProfile(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }
}
