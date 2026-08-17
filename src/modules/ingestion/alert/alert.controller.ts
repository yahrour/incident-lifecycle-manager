import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { AlertService } from "./alert.service";
import type { DatadogWebhookPayload } from "./providers/datadog/dto/datadog-webhook.dto";

@Controller({
  path: "ingestion/alerts",
  version: "1",
})
export class AlertController {
  constructor(private readonly alert: AlertService) {}

  @Post("datadog")
  @Public()
  async ingestDatadogAlert(
    @Headers("x-api-key") apiKey: string,
    @Body() payload: DatadogWebhookPayload
  ) {
    const trusted = await this.alert.verifyApiKey(apiKey);

    if (!trusted) throw new UnauthorizedException("Invalid ingestion API key");

    return this.alert.normalizeDatadogAlert(payload);
  }
}
