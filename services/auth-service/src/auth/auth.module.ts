import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersModule } from "src/users/users.module";
import { AuthController } from "./auth.controller";

@Module({
  providers: [AuthService],
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // 1. Tell JwtModule to use ConfigModule
      inject: [ConfigService], // 2. Inject the ConfigService into the factory
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error("JWT_SECRET environment variable is missing!");
        }

        return {
          secret: secret,
          signOptions: {
            expiresIn: parseInt(
              configService.get<string>("JWT_ACCESS_TOKEN_TTL") || "3600",
              10
            ),
            issuer: configService.get<string>("JWT_ISSUER"),
            audience: configService.get<string>("JWT_AUDIENCE"),
          },
        };
      },
    }),
  ],
  exports: [JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
