import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class DatadogWebhookPayload {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @IsOptional()
  date?: string | number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  priority?: string;
}
