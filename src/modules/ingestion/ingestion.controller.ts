import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { IngestionService } from "./ingestion.service";
import { ActiveUser } from "../common/decorators/active-user.decorator";
import type { ActiveUserData } from "../common/interfaces/active-user.interface";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "src/generated/prisma/enums";

@Controller("ingestion")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  // POST /ingestion/generate-api-key -> xxxx-xxxxx-xxxxx-xxxxx
  @Post("generate-api-key")
  @Roles(Role.SRE)
  async generateApiKey(
    @ActiveUser() user: ActiveUserData,
    @Body("name") name: string
  ) {
    if (!user.sub || !name) {
      throw new UnauthorizedException("Missing required headers");
    }

    const { apiKey, prefix } = await this.ingestionService.generateApiKey(
      user.sub,
      name
    );

    return { apiKey, prefix };
  }

  // GET /ingestion/api-keys
  @Get("api-keys")
  @Roles(Role.SRE)
  async getApiKeys(@ActiveUser() user: ActiveUserData) {
    const apiKeys = await this.ingestionService.getApiKeys(user.sub);

    return { apiKeys };
  }

  // POST /ingestion/disable-api-key

  @Post("disable-api-key")
  @Roles(Role.SRE)
  async disableApiKey(
    @ActiveUser() user: ActiveUserData,
    @Body("id") id: string
  ) {
    await this.ingestionService.disableApiKey(user.sub, id);

    return { ok: true };
  }
  // POST /ingestion/enable-api-key
  @Post("enable-api-key")
  @Roles(Role.SRE)
  async enableApiKey(
    @ActiveUser() user: ActiveUserData,
    @Body("id") id: string
  ) {
    await this.ingestionService.enableApiKey(user.sub, id);

    return { ok: true };
  }
  // POST /ingestion/delete-api-key
  @Post("delete-api-key")
  @Roles(Role.SRE)
  async deleteApiKey(
    @ActiveUser() user: ActiveUserData,
    @Body("id") id: string
  ) {
    await this.ingestionService.deleteApiKey(user.sub, id);

    return { ok: true };
  }

  @Post()
  @Public()
  async ingestAlert(@Headers("x-api-key") apiKey: string) {
    const trusted = await this.ingestionService.verifyApiKey(apiKey);

    if (!trusted) {
      throw new UnauthorizedException("Invalid ingestion API key");
    }

    return { ok: true };
  }
}
