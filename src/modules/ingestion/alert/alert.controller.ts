import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Public } from "src/modules/common/decorators/public.decorator";
import { AlertService } from "./alert.service";

@Controller({
  path: "ingestion/alerts",
  version: "1",
})
export class AlertController {
  constructor(private readonly alert: AlertService) {}

  @Post()
  @Public()
  async ingestAlert(@Headers("x-api-key") apiKey: string) {
    const trusted = await this.alert.verifyApiKey(apiKey);

    if (!trusted) {
      throw new UnauthorizedException("Invalid ingestion API key");
    }

    return { ok: true };
  }
}
