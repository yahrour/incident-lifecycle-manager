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
import { ActiveUser } from "@/common/decorators/active-user.decorator";
import type { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { OffsetPaginationSearchParams } from "./dto";
import { apiResponse } from "@/common/utils/api-response";

@Controller({
  path: "teams",
  version: "1",
})
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get(":id/members")
  @Roles(Role.SRE)
  async findAll(
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: OffsetPaginationSearchParams,
    @ActiveUser() user: ActiveUserData
  ) {
    const { members, total } = await this.membersService.findAll(
      id,
      user.sub,
      query
    );
    return apiResponse(members, { total });
  }

  @Get(":id/members/:memberId")
  @Roles(Role.SRE)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    const result = await this.membersService.findOne(id, memberId, user.sub);
    return apiResponse(result);
  }

  @Delete(":id/members/:memberId")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseIntPipe) memberId: number,
    @ActiveUser() user: ActiveUserData
  ) {
    await this.membersService.remove(id, memberId, user.sub);
  }
}
