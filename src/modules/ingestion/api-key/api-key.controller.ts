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
} from "@nestjs/common";
import { Role } from "src/generated/prisma/enums";
import { ActiveUser } from "../../../common/decorators/active-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import type { ActiveUserData } from "../../../common/interfaces/active-user.interface";
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
  async create(@ActiveUser() user: ActiveUserData, @Body() dto: CreateApiKey) {
    const { apiKey, prefix } = await this.apiKeyService.create(
      user.sub,
      dto.name
    );

    return { data: { apiKey, prefix } };
  }

  @Get()
  @Roles(Role.SRE)
  async findAll(@ActiveUser() user: ActiveUserData) {
    const apiKeys = await this.apiKeyService.findAll(user.sub);

    return { data: apiKeys };
  }

  @Post("disable/:id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async disable(
    @ActiveUser() user: ActiveUserData,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.apiKeyService.disable(user.sub, id);
  }

  @Post("enable/:id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async enable(
    @ActiveUser() user: ActiveUserData,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.apiKeyService.enable(user.sub, id);
  }

  @Delete("delete/:id")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @ActiveUser() user: ActiveUserData,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.apiKeyService.delete(user.sub, id);
  }
}
