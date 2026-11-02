import { Req, Controller, Post, Body, Get, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
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
  async getProfile(@Req() { user }: AuthRequest) {
    const profile = await this.usersService.getProfile(user.sub);
    return apiResponse(profile);
  }

  @Patch("me")
  async updateProfile(
    @Req() { user }: AuthRequest,
    @Body() dto: UpdateProfileDto
  ) {
    const profile = await this.usersService.updateProfile(user.sub, dto);
    return apiResponse(profile);
  }

  @Get("me/on-call")
  @Roles(Role.ENGINEER)
  async getMyOnCallStatus(@Req() { user }: AuthRequest) {
    const result = await this.usersService.getMyOnCallStatus(user.sub);
    return apiResponse(result);
  }

  @Get("me/membership")
  @Roles(Role.ENGINEER)
  async getMyMembership(@Req() { user }: AuthRequest) {
    const result = await this.usersService.getMyMembership(user.sub);
    return apiResponse(result);
  }

  @Get("me/team")
  @Roles(Role.ENGINEER)
  async getMyTeam(@Req() { user }: AuthRequest) {
    const result = await this.usersService.getMyTeam(user.sub);
    return apiResponse(result);
  }
}
