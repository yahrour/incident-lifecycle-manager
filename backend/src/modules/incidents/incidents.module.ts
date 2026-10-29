import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OncallModule } from "@/modules/on-call/on-call.module";
import { IncidentsController } from "./incidents.controller";
import { IncidentsGateway } from "./incidents.gateway";
import { IncidentsService } from "./incidents.service";

@Module({
  imports: [OncallModule, JwtModule.register({})],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsGateway],
  exports: [IncidentsService],
})
export class IncidentsModule {}
