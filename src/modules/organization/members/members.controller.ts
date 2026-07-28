import {
  Controller,
  Get,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { MembersService } from "./members.service";
import { ActiveUser } from "src/modules/common/decorators/active-user.decorator";
import type { ActiveUserData } from "src/modules/common/interfaces/active-user.interface";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";
import { PaginationSearchParams } from "./dto";

@Controller({
  path: "teams",
  version: "1",
})
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get(":id/members")
  @Roles(Role.SRE)
  findMany(
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: PaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.membersService.findAll(id, user.sub, query);
  }

  @Get(":id/members/:memberId")
  @Roles(Role.SRE)
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.membersService.findOne(id, memberId, user.sub);
  }

  @Delete(":id/members/:memberId")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.membersService.removeMember(id, memberId, user.sub);
  }
}
