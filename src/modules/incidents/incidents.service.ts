import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Prisma } from "@/generated/prisma/client";
import { OnCallService } from "@/modules/oncall/oncall.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { FindIncidentsDto } from "./dto/find-incidents.dto";
import { INCIDENT_STATUS } from "./constants";

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onCallService: OnCallService
  ) {}

  private encodeCursor(id: string) {
    return Buffer.from(JSON.stringify({ id })).toString("base64url");
  }

  private decodeCursor(raw: string) {
    try {
      const parsed: unknown = JSON.parse(
        Buffer.from(raw, "base64url").toString("utf-8")
      );
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("id" in parsed) ||
        typeof parsed.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          parsed.id
        )
      ) {
        throw new Error();
      }
      return parsed.id;
    } catch {
      throw new BadRequestException("Invalid cursor");
    }
  }

  async findAll(userId: string, query: FindIncidentsDto) {
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const where: Prisma.IncidentWhereInput = {
      AND: [
        {
          OR: [
            { assignedToId: userId },
            { team: { ownerId: userId } },
            { team: { teamMembers: { some: { userId } } } },
          ],
        },
        ...(query.status ? [{ status: query.status }] : []),
        ...(query.severity ? [{ severity: query.severity }] : []),
        ...(query.teamId ? [{ teamId: query.teamId }] : []),
        ...(query.search
          ? [
              {
                OR: [
                  {
                    title: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    service: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        take: query.limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          team: { select: { id: true, name: true } },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    const hasNextPage = data.length > query.limit;
    const page = hasNextPage ? data.slice(0, query.limit) : data;
    const nextCursor = hasNextPage
      ? this.encodeCursor(page[page.length - 1].id)
      : null;

    return { data: page, total, nextCursor };
  }

  async findOne(userId: string, incidentId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: {
        id: incidentId,
        OR: [
          { assignedToId: userId },
          { team: { ownerId: userId } },
          { team: { teamMembers: { some: { userId } } } },
        ],
      },
      include: {
        team: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!incident) throw new NotFoundException("Incident doesn't exist");

    const timeline = [
      { type: "created", at: incident.createdAt },
      ...(incident.acknowledgedAt
        ? [{ type: "acknowledged", at: incident.acknowledgedAt }]
        : []),
      ...(incident.resolvedAt
        ? [{ type: "resolved", at: incident.resolvedAt }]
        : []),
    ];

    return {
      ...incident,
      metrics: {
        mttaSeconds: incident.mttaSeconds,
        mttrSeconds: incident.mttrSeconds,
      },
      timeline,
    };
  }

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

  async reassign(ownerId: string, incidentId: string, assigneeId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, team: { ownerId } },
      select: { id: true, teamId: true },
    });

    if (!incident) throw new NotFoundException("Incident doesn't exist");
    if (!incident.teamId) throw new ConflictException("Incident has no team");

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId: incident.teamId, userId: assigneeId },
    });
    if (!member) {
      throw new NotFoundException(
        "Assignee is not a member of the incident team"
      );
    }

    return this.prisma.incident.update({
      where: { id: incidentId },
      data: { assignedToId: assigneeId },
      include: {
        team: { select: { id: true, name: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
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

    if (incident.assignedToId !== userId) {
      throw new ForbiddenException("You cannot acknowledge this incident");
    }

    const acknowledgedAt = new Date();
    const result = await this.prisma.incident.updateMany({
      where: { id: incidentId, status: INCIDENT_STATUS.OPEN },
      data: {
        status: INCIDENT_STATUS.ACKNOWLEDGED,
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

  async resolve(userId: string, incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException("Incident doesn't exist");
    }

    if (incident.assignedToId !== userId) {
      throw new ForbiddenException("You cannot resolve this incident");
    }

    if (incident.status !== INCIDENT_STATUS.ACKNOWLEDGED) {
      throw new ConflictException("Incident must be acknowledged first");
    }

    const resolvedAt = new Date();
    const result = await this.prisma.incident.updateMany({
      where: {
        id: incidentId,
        status: INCIDENT_STATUS.ACKNOWLEDGED,
        assignedToId: userId,
      },
      data: {
        status: INCIDENT_STATUS.RESOLVED,
        resolvedAt,
        mttrSeconds: Math.floor(
          (resolvedAt.getTime() - incident.createdAt.getTime()) / 1000
        ),
      },
    });

    if (result.count === 0) {
      throw new ConflictException("Incident is no longer acknowledged");
    }

    return this.prisma.incident.findUnique({ where: { id: incidentId } });
  }
}
