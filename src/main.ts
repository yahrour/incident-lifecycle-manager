import { webcrypto } from "node:crypto";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import cookieParser from "cookie-parser";

globalThis.crypto ??= webcrypto as unknown as Crypto;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.setGlobalPrefix("/api");
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      disableErrorMessages:
        configService.get<string>("NODE_ENV") === "production",
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );
  app.use(cookieParser());
  await app.listen(configService.get("PORT")!);
}
void bootstrap();
