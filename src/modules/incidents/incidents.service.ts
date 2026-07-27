import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { OnCallService } from "src/modules/organization/oncall/oncall.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onCallService: OnCallService
  ) {}

  async create(ownerId: string, createIncidentDto: CreateIncidentDto) {
    const onCall = await this.onCallService.getCurrentOnCall(
      createIncidentDto.teamId,
      ownerId
    );
    const assigneeUserId = onCall?.chain.find(
      ({ role }) => role === "PRIMARY"
    )?.userId;

    if (!assigneeUserId) {
      throw new ConflictException("No on-call engineer available");
    }

    return this.prisma.incident.create({
      data: {
        ...createIncidentDto,
        assignedToId: assigneeUserId,
      },
    });
  }
}
