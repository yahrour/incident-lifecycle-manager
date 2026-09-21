import { Injectable } from "@nestjs/common";
import { AlertAdapter } from "../../common/alert.adapter";
import { AlertSeverity, CommonAlert } from "../../common/common-alert";
import { PrometheusAlertmanagerPayload } from "./dto/prometheus-alertmanager.dto";

@Injectable()
export class PrometheusAdapter extends AlertAdapter<PrometheusAlertmanagerPayload> {
  normalize(payload: PrometheusAlertmanagerPayload): CommonAlert {
    const alert = payload.alerts?.[0];
    const labels = alert?.labels ?? {};
    const annotations = alert?.annotations ?? {};

    return {
      provider: "prometheus",
      serviceName: labels.service ?? payload.receiver,
      title: labels.alertname ?? annotations.summary ?? "Prometheus alert",
      message:
        annotations.description ??
        annotations.summary ??
        alert?.status ??
        payload.status ??
        "Prometheus alert",
      severity: this.mapSeverity(labels.severity),
      occurredAt: this.mapOccurredAt(alert?.startsAt),
    };
  }

  private mapSeverity(severity?: string): AlertSeverity {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "p1":
      case "fatal":
        return "critical";
      case "warning":
      case "warn":
      case "p2":
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
