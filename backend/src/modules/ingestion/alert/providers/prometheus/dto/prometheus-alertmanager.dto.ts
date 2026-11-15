import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PrometheusAlertLabel {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  alertname?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  severity?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  service?: string;
}

export class PrometheusAlertAnnotation {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  summary?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}

export class PrometheusAlert {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;

  @IsOptional()
  labels?: PrometheusAlertLabel;

  @IsOptional()
  annotations?: PrometheusAlertAnnotation;

  @IsOptional()
  startsAt?: string;
}

export class PrometheusAlertmanagerPayload {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  receiver?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;

  @IsOptional()
  alerts?: PrometheusAlert[];
}
