import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { AlertService } from "./alert.service";

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
    const trusted = await this.alert.verifyApiKey(apiKey);

    if (!trusted) throw new UnauthorizedException("Invalid ingestion API key");

    return this.alert.ingestAlert(provider, payload);
  }
}
