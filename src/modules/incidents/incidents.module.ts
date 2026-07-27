import { Module } from "@nestjs/common";
import { OncallModule } from "src/modules/organization/oncall/oncall.module";
import { IncidentsController } from "./incidents.controller";
import { IncidentsService } from "./incidents.service";

@Module({
  imports: [OncallModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
