import { Controller, Post, Body, Get, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { apiResponse } from "@/common/utils/api-response";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";

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
    const profile = await this.usersService.updateProfile(user.sub, dto);
    return apiResponse(profile);
  }

  @Get("me/on-call")
  @Roles(Role.ENGINEER)
  async getMyOnCallStatus(@ActiveUser() user: ActiveUserData) {
    const result = await this.usersService.getMyOnCallStatus(user.sub);
    return apiResponse(result);
  }

  @Get("me/membership")
  @Roles(Role.ENGINEER)
  async getMyMembership(@ActiveUser() user: ActiveUserData) {
    const result = await this.usersService.getMyMembership(user.sub);
    return apiResponse(result);
  }

  @Get("me/team")
  @Roles(Role.ENGINEER)
  async getMyTeam(@ActiveUser() user: ActiveUserData) {
    const result = await this.usersService.getMyTeam(user.sub);
    return apiResponse(result);
  }
}
