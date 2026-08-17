import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { CommonAlert } from "./common/common-alert";
import { DatadogAdapter } from "./providers/datadog/datadog.adapter";
import { DatadogWebhookPayload } from "./providers/datadog/dto/datadog-webhook.dto";

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datadogAdapter: DatadogAdapter
  ) {}

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  async verifyApiKey(providedKey?: string): Promise<boolean> {
    if (!providedKey) {
      return false;
    }

    const keyHash = this.hashApiKey(providedKey);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.enabled) {
      return false;
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return false;
    }

    return true;
  }

  normalizeDatadogAlert(payload: DatadogWebhookPayload): CommonAlert {
    return this.datadogAdapter.normalize(payload);
  }
}
