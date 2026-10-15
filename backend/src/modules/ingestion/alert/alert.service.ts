import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { IncidentsService } from "@/modules/incidents/incidents.service";
import { CommonAlert } from "./common/common-alert";
import { PrometheusAdapter } from "./providers/prometheus/prometheus.adapter";
import { PrometheusAlertmanagerPayload } from "./providers/prometheus/dto/prometheus-alertmanager.dto";
import { FindAlertsDto } from "./dto/find-alerts.dto";

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prometheusAdapter: PrometheusAdapter,
    private readonly incidents: IncidentsService
  ) {}

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  async verifyApiKey(providedKey?: string): Promise<string | null> {
    if (!providedKey) return null;

    const keyHash = this.hashApiKey(providedKey);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.enabled) return null;

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

    return apiKey.ownerId;
  }

  async ingestAlert(ownerId: string, provider: string, payload: unknown) {
    const normalized = this.normalizeAlert(provider, payload);
    const alert = await this.prisma.alert.create({
      data: {
        provider: normalized.provider,
        title: normalized.title,
        service: normalized.serviceName,
        message: normalized.message,
        severity: normalized.severity,
        status: normalized.status,
        occurredAt: normalized.occurredAt,
        payload: payload as object,
      },
    });

    const incidentId = await this.incidents.createFromAlert(
      ownerId,
      alert.id,
      normalized
    );

    return {
      ...normalized,
      id: alert.id,
      receivedAt: alert.receivedAt,
      incidentId,
    };
  }

  async findAll(query: FindAlertsDto) {
    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        skip: query.offset,
        take: query.limit,
        orderBy: { receivedAt: "desc" },
        omit: { payload: true },
      }),
      this.prisma.alert.count(),
    ]);

    return { alerts, total };
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
