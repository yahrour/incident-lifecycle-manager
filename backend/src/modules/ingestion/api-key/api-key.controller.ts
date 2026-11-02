import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import { Role } from "@/generated/prisma/enums";
import { Roles } from "@/common/decorators/roles.decorator";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
import { CreateApiKey } from "./dto/create-api-key.dto";
import { ApiKeyService } from "./api-key.service";

@Controller({
  path: "ingestion/api-keys",
  version: "1",
})
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post("create")
  @Roles(Role.SRE)
  async create(@Req() { user }: AuthRequest, @Body() dto: CreateApiKey) {
    const { apiKey, prefix, expiresAt } = await this.apiKeyService.create(
      user.sub,
      dto.name,
      dto.expiresInDays
    );

    return { data: { apiKey, prefix, expiresAt } };
  }

  @Get()
  @Roles(Role.SRE)
  async findAll(@Req() { user }: AuthRequest) {
    const apiKeys = await this.apiKeyService.findAll(user.sub);

    return { data: apiKeys };
  }

  @Post("disable/:id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async disable(
    @Req() { user }: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.apiKeyService.disable(user.sub, id);
  }

  @Post("enable/:id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async enable(
    @Req() { user }: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.apiKeyService.enable(user.sub, id);
  }

  @Delete("delete/:id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Req() { user }: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.apiKeyService.delete(user.sub, id);
  }
}
