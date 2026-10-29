import { Module } from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { TeamsController } from "./teams.controller";
import { MulterModule } from "@nestjs/platform-express";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  providers: [TeamsService],
  controllers: [TeamsController],
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize: Number(config.get("IMPORT_MAX_FILE_BYTES")),
          files: 1,
        },
      }),
    }),
  ],
})
export class TeamsModule {}
