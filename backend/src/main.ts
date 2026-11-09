import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { execSync } from "node:child_process";
import { loadSecretsFromVault } from "@/vault/load-secrets";

async function bootstrap() {
  await loadSecretsFromVault();
  execSync("npx prisma db push", { stdio: "inherit" }); // create/update tables
  const { AppModule } = await import("./app.module.js");
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.enableCors({
    origin:
      configService.get<string>("FRONTEND_URL") ?? "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  });
  app.setGlobalPrefix("/api");
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
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
bootstrap();
