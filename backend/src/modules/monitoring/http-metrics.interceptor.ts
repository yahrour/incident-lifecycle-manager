import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { Observable } from "rxjs";
import type { Response, Request } from "express";

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric("http_request_duration_seconds")
    private readonly durationHistogram: Histogram<string>
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const route =
      (req.route as { path?: string } | undefined)?.path ?? "unknown";

    if (route.endsWith("/metrics")) return next.handle();

    const end = this.durationHistogram.startTimer();
    res.on("finish", () => {
      end({ method: req.method, route, status: String(res.statusCode) });
    });

    return next.handle();
  }
}
