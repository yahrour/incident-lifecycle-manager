import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    )?.id;

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

  async acknowledge(userId: string, incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { team: true },
    });

    if (!incident) {
      throw new NotFoundException("Incident doesn't exist");
    }

    if (incident.assignedToId !== userId && incident.team?.ownerId !== userId) {
      throw new ForbiddenException("You cannot acknowledge this incident");
    }

    const acknowledgedAt = new Date();
    const result = await this.prisma.incident.updateMany({
      where: { id: incidentId, status: "open" },
      data: {
        status: "acknowledged",
        acknowledgedAt,
        mttaSeconds: Math.floor(
          (acknowledgedAt.getTime() - incident.createdAt.getTime()) / 1000
        ),
      },
    });

    if (result.count === 0) {
      throw new ConflictException("Incident is no longer open");
    }

    return this.prisma.incident.findUnique({ where: { id: incidentId } });
  }
}
