import { Controller, Get, Param, ParseUUIDPipe, Headers } from "@nestjs/common";
import { OnCallService } from "../services/oncall.service";

@Controller({
  path: "teams",
  version: "1",
})
export class OnCallController {
  constructor(private readonly onCallService: OnCallService) {}

  @Get(":id/oncall/current")
  getCurrentOnCall(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("x-user-id") ownerId: string,
  ) {
    ownerId = "ae69daf4-5f81-4026-8b7d-111111111111"; // WARN: remove later when attching user info in the request using the API Gateway
    return this.onCallService.getCurrentOnCall(id, ownerId);
  }
}
