import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { CommonAlert } from "./common/common-alert";
import { PrometheusAdapter } from "./providers/prometheus/prometheus.adapter";
import { PrometheusAlertmanagerPayload } from "./providers/prometheus/dto/prometheus-alertmanager.dto";

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prometheusAdapter: PrometheusAdapter
  ) {}

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  async verifyApiKey(providedKey?: string): Promise<boolean> {
    if (!providedKey) return false;

    const keyHash = this.hashApiKey(providedKey);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.enabled) return false;

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return false;

    return true;
  }

  async ingestAlert(provider: string, payload: unknown) {
    const normalized = this.normalizeAlert(provider, payload);
    const alert = await this.prisma.alert.create({
      data: {
        provider: normalized.provider,
        title: normalized.title,
        service: normalized.serviceName,
        message: normalized.message,
        severity: normalized.severity,
        occurredAt: normalized.occurredAt,
        payload: payload as object,
      },
    });

    return {
      ...normalized,
      id: alert.id,
      receivedAt: alert.receivedAt,
    };
  }

  private normalizeAlert(provider: string, payload: unknown): CommonAlert {
    switch (provider.toLowerCase()) {
      case "prometheus":
        return this.prometheusAdapter.normalize(
          payload as PrometheusAlertmanagerPayload
        );

      default:
        throw new NotFoundException(`Unsupported alert provider: ${provider}`);
    }
  }
}
