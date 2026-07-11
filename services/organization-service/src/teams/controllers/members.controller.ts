import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AddMemberDto } from "../dto";
import { MembersService } from "../services/members.service";

@Controller({
  path: "teams",
  version: "1",
})
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post(":id/members")
  addMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-user-id") ownerId: string,
    @Body() addMemberDto: AddMemberDto
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.membersService.add(id, ownerId, addMemberDto.userId);
  }

  @Get(":id/members")
  findMany(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.membersService.findAll(id, ownerId);
  }

  @Get(":id/members/:memberId")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.membersService.findOne(id, memberId, ownerId);
  }

  @Delete(":id/members/:memberId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
    @Headers("x-user-id") ownerId: string
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.membersService.removeMember(id, memberId, ownerId);
  }
}
