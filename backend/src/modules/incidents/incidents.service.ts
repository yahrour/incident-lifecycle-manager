import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Prisma } from "@/generated/prisma/client";
import { OnCallService } from "@/modules/on-call/on-call.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { FindIncidentsDto } from "./dto/find-incidents.dto";
import { INCIDENT_STATUS } from "./constants";
import { createIncidentFingerprint } from "./utils/incident-fingerprint";
import { IncidentsGateway } from "./incidents.gateway";

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly onCallService: OnCallService,
    private readonly gateway: IncidentsGateway
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

  // Incidents a user may see: their own, or any belonging to a team they own or
  // are a member of.
  private accessibleBy(userId: string): Prisma.IncidentWhereInput {
    return {
      OR: [
        { assignedToId: userId },
        { team: { ownerId: userId } },
        { team: { teamMembers: { some: { userId } } } },
      ],
    };
  }

  async findAll(userId: string, query: FindIncidentsDto) {
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const where: Prisma.IncidentWhereInput = {
      AND: [
        this.accessibleBy(userId),
        ...(query.status ? [{ status: query.status }] : []),
        ...(query.severity ? [{ severity: query.severity }] : []),
        ...(query.teamId ? [{ teamId: query.teamId }] : []),
        ...(query.service ? [{ service: query.service }] : []),
        ...(query.assigneeId ? [{ assignedToId: query.assigneeId }] : []),
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
      where: { id: incidentId, ...this.accessibleBy(userId) },
      include: {
        team: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        notes: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        alerts: { select: { alertId: true } },
      },
    });

    if (!incident) throw new NotFoundException("Incident doesn't exist");

    const alertIds = (incident.alerts ?? []).map(({ alertId }) => alertId);
    const alerts = alertIds.length
      ? await this.prisma.alert.findMany({
          where: { id: { in: alertIds } },
          select: {
            id: true,
            provider: true,
            title: true,
            severity: true,
            status: true,
            occurredAt: true,
            receivedAt: true,
          },
          orderBy: { receivedAt: "asc" },
        })
      : [];

    const timeline = [
      { type: "created", at: incident.createdAt },
      ...(incident.acknowledgedAt
        ? [{ type: "acknowledged", at: incident.acknowledgedAt }]
        : []),
      ...(incident.escalatedAt
        ? [{ type: "escalated", at: incident.escalatedAt }]
        : []),
      ...(incident.resolvedAt
        ? [{ type: "resolved", at: incident.resolvedAt }]
        : []),
      ...(incident.notes ?? []).map((note) => ({
        type: "note_added",
        at: note.createdAt,
        noteId: note.id,
        actor: note.author,
      })),
      ...alerts.map((alert) => ({
        type: "alert_received",
        at: alert.receivedAt,
        alertId: alert.id,
        status: alert.status,
      })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());

    return {
      ...incident,
      alerts,
      metrics: {
        mttaSeconds: incident.mttaSeconds,
        mttrSeconds: incident.mttrSeconds,
      },
      timeline,
    };
  }

  async createNote(userId: string, incidentId: string, content: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, ...this.accessibleBy(userId) },
      select: { id: true, teamId: true, status: true, assignedToId: true },
    });

    if (!incident) throw new NotFoundException("Incident doesn't exist");

    const note = await this.prisma.incidentNote.create({
      data: { incidentId: incident.id, authorId: userId, content },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    this.gateway.incidentChanged(incident);
    return note;
  }

  async create(ownerId: string, createIncidentDto: CreateIncidentDto) {
    const onCall = await this.onCallService.getCurrentOnCall(
      ownerId,
      createIncidentDto.teamId
    );
    const assigneeUserId = onCall?.chain.find(
      ({ position }) => position === "PRIMARY"
    )?.id;

    if (!assigneeUserId) {
      throw new ConflictException("No on-call engineer available");
    }

    const incident = await this.prisma.incident.create({
      data: {
        ...createIncidentDto,
        fingerprint: createIncidentFingerprint(
          "manual",
          createIncidentDto.service,
          createIncidentDto.title
        ),
        assignedToId: assigneeUserId,
      },
    });
    this.gateway.incidentChanged(incident);
    return incident;
  }

  async createFromAlert(
    ownerId: string,
    alertId: string,
    alert: {
      provider: string;
      title: string;
      serviceName?: string;
      severity: string;
      status?: string;
      team?: string;
    }
  ) {
    const team =
      alert.team &&
      (await this.prisma.team.findFirst({
        where: { ownerId, name: alert.team },
        select: { id: true },
      }));
    if (!team) {
      this.logger.warn(
        `Alert ${alertId} has dropped, no such team "${alert.team ?? ""}"`
      );
      return null;
    }

    const service = alert.serviceName ?? "unknown";
    const fingerprint = createIncidentFingerprint(
      alert.provider,
      service,
      alert.title
    );
    const where = {
      unique_team_open_fingerprint: {
        teamId: team.id,
        openFingerprint: fingerprint,
      },
    };

    const select = { id: true, teamId: true, status: true, assignedToId: true };
    let incident = await this.prisma.incident.findUnique({ where, select });
    if (!incident) {
      if (alert.status === "resolved") return null;
      const onCall = await this.onCallService.getCurrentOnCall(
        ownerId,
        team.id
      );

      incident = await this.prisma.incident.upsert({
        where,
        update: {},
        create: {
          teamId: team.id,
          title: alert.title,
          service,
          severity:
            { critical: "critical", warning: "medium" }[alert.severity] ??
            "low",
          fingerprint,
          openFingerprint: fingerprint,
          assignedToId: onCall?.chain.find(
            ({ position }) => position === "PRIMARY"
          )?.id,
        },
        select,
      });
    }

    await this.prisma.incidentAlert.create({
      data: { alertId, incidentId: incident.id },
    });
    this.gateway.incidentChanged(incident);
    return incident.id;
  }

  async reassign(
    ownerId: string,
    incidentId: string,
    assigneeId: string,
    note?: string
  ) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, team: { ownerId } },
      select: { id: true, teamId: true, status: true },
    });

    if (!incident) throw new NotFoundException("Incident doesn't exist");
    if (!incident.teamId) throw new ConflictException("Incident has no team");
    if (incident.status === INCIDENT_STATUS.RESOLVED) {
      throw new ConflictException("Resolved incidents cannot be reassigned");
    }

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId: incident.teamId, userId: assigneeId },
    });
    if (!member) {
      throw new NotFoundException(
        "Assignee is not a member of the incident team"
      );
    }

    const update = this.prisma.incident.update({
      where: { id: incidentId },
      data: { assignedToId: assigneeId },
      include: {
        team: { select: { id: true, name: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const [updated] = note
      ? await this.prisma.$transaction([
          update,
          this.prisma.incidentNote.create({
            data: { incidentId, authorId: ownerId, content: note },
          }),
        ])
      : [await update];
    this.gateway.incidentChanged(updated);
    return updated;
  }

  async acknowledge(userId: string, incidentId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, ...this.accessibleBy(userId) },
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
      where: {
        id: incidentId,
        status: INCIDENT_STATUS.OPEN,
        assignedToId: userId,
      },
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

    const updated = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (updated) this.gateway.incidentChanged(updated);
    return updated;
  }

  async resolve(userId: string, incidentId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, ...this.accessibleBy(userId) },
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
        openFingerprint: null,
        mttrSeconds: Math.floor(
          (resolvedAt.getTime() - incident.createdAt.getTime()) / 1000
        ),
      },
    });

    if (result.count === 0) {
      throw new ConflictException("Incident is no longer acknowledged");
    }

    const updated = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (updated) this.gateway.incidentChanged(updated);
    return updated;
  }
  @Cron(CronExpression.EVERY_MINUTE)
  async escalateUnacknowledged() {
    const openIncidents = await this.prisma.incident.findMany({
      where: {
        status: INCIDENT_STATUS.OPEN,
        escalatedAt: null,
      },
      include: { team: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    for (const incident of openIncidents) {
      if (!incident.team) {
        continue;
      }
      try {
        const waited = Date.now() - incident.createdAt.getTime();
        const escalationTimeout =
          incident.team.escalationTimeoutMinutes * 60 * 1000;
        if (incident.assignedToId && waited < escalationTimeout) {
          continue;
        }

        const onCall = await this.onCallService.getCurrentOnCall(
          incident.team.ownerId,
          incident.team.id
        );

        if (!incident.assignedToId) {
          const primary = onCall?.chain.find((engineer) => {
            return engineer.position === "PRIMARY";
          });
          if (primary) {
            const { count } = await this.prisma.incident.updateMany({
              where: {
                id: incident.id,
                status: INCIDENT_STATUS.OPEN,
                assignedToId: null,
              },
              data: { assignedToId: primary.id },
            });
            if (count > 0) {
              this.gateway.incidentChanged({
                ...incident,
                assignedToId: primary.id,
              });
            }
          }
          continue;
        }

        const secondary = onCall?.chain.find((engineer) => {
          return engineer.position === "SECONDARY";
        });
        const escalateToId =
          secondary && secondary.id !== incident.assignedToId
            ? secondary.id
            : incident.team.ownerId;

        const { count } = await this.prisma.incident.updateMany({
          where: {
            id: incident.id,
            status: INCIDENT_STATUS.OPEN,
            assignedToId: incident.assignedToId,
          },

          data: { assignedToId: escalateToId, escalatedAt: new Date() },
        });
        if (count > 0) {
          this.gateway.incidentChanged({
            ...incident,
            assignedToId: escalateToId,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to escalate incident ${incident.id}`, error);
      }
    }
  }
}
