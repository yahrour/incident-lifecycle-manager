import { Controller, Post, Body, Get, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { UpdateProfileDto } from "./dto/update-profile.dto";

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

  // @Patch("me/email")
  // async updateEmail(
  //   @ActiveUser() user: ActiveUserData,
  //   @Body() dto: UpdateProfileDto
  // ) {
  //   return this.usersService.updateEmail(user.sub, dto);
  // }
  // @Get()
  // findAll() {
  //   return this.usersService.findAll();
  // }
  //
  // @Get(":id")
  // findOne(@Param("id") id: string) {
  //   return this.usersService.findOne(+id);
  // }
  //
  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }
  //
  // @Delete(":id")
  // remove(@Param("id") id: string) {
  //   return this.usersService.remove(+id);
  // }
}
