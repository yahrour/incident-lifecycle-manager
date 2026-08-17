import { Injectable } from "@nestjs/common";
import { AlertAdapter } from "../../common/alert.adapter";
import { AlertSeverity, CommonAlert } from "../../common/common-alert";
import { DatadogWebhookPayload } from "./dto/datadog-webhook.dto";

@Injectable()
export class DatadogAdapter extends AlertAdapter<DatadogWebhookPayload> {
  normalize(payload: DatadogWebhookPayload): CommonAlert {
    return {
      provider: "datadog",
      title: payload.title ?? "Datadog alert",
      message: payload.text,
      severity: this.mapSeverity(payload.priority),
      occurredAt: this.mapOccurredAt(payload.date),
    };
  }

  private mapSeverity(priority?: string): AlertSeverity {
    switch (priority?.toUpperCase()) {
      case "P1":
        return "critical";
      case "P2":
        return "warning";
      default:
        return "info";
    }
  }

  private mapOccurredAt(date?: string | number): Date {
    if (date === undefined || date === null) return new Date();

    const occurredAt = new Date(date);

    if (Number.isNaN(occurredAt.getTime())) return new Date();

    return occurredAt;
  }
}
