import { Module } from "@nestjs/common";
import { ApiKeyModule } from "./api-key/api-key.module";
import { AlertModule } from "./alert/alert.module";

@Module({
  controllers: [],
  providers: [],
  imports: [ApiKeyModule, AlertModule],
})
export class IngestionModule {}
