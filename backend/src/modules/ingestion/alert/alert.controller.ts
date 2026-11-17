import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
import { Public } from "@/common/decorators/public.decorator";
import { AlertService } from "./alert.service";
import { Roles } from "@/common/decorators/roles.decorator";
import { FindAlertsDto } from "./dto/find-alerts.dto";
import { apiResponse } from "@/common/utils/api-response";
import { Role } from "@/generated/prisma/enums";

@Controller({
  path: "ingestion/alerts",
  version: "1",
})
export class AlertController {
  constructor(private readonly alert: AlertService) {}

  @Post(":provider")
  @Public()
  async ingestAlert(
    @Param("provider") provider: string,
    @Headers("x-api-key") apiKey: string,
    @Body() payload: unknown
  ) {
    const ownerId = await this.alert.verifyApiKey(apiKey);

    if (!ownerId) throw new UnauthorizedException("Invalid ingestion API key");

    return this.alert.ingestAlert(ownerId, provider, payload);
  }

  @Get()
  @Roles(Role.SRE)
  async findAll(@Req() { user }: AuthRequest, @Query() query: FindAlertsDto) {
    const { alerts, total } = await this.alert.findAll(user.sub, query);
    return apiResponse(alerts, { total });
  }
}
