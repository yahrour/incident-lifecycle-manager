import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.enableCors({
    origin:
      configService.get<string>("FRONTEND_URL") ?? "http://localhost:5173",
    credentials: true,
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
bootstrap();
