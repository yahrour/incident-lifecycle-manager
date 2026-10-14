import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/common/prisma/prisma.service";
import { INCIDENT_STATUS } from "../incidents/constants";

@Injectable()
export class OnCallService {
  constructor(private prisma: PrismaService) {}

  private addDays(date: Date, n: number) {
    return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
  }

  async getCurrentOnCall(ownerId: string, teamId: string) {
    const now = new Date();
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, ownerId },
      include: {
        teamMembers: {
          orderBy: { joinedAt: "asc" },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                specialty: true,
                role: true,
              },
            },
            unavailabilities: {
              where: {
                startDate: { lte: now },
                endDate: { gte: now },
                confirmed: true,
                status: "APPROVED",
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    if (team.teamMembers.length === 0) {
      return null;
    }

    const members = team.teamMembers;
    const totalMembers = members.length;

    type Member = (typeof members)[0];
    let primary: Member | null = null;
    let secondary: Member | null = null;

    for (let i = 0; i < totalMembers; i++) {
      const currentRotationIndex =
        (team.currentRotationIndex + i) % totalMembers;
      const member = members[currentRotationIndex];

      const isAvailable = member.unavailabilities.length === 0;

      if (isAvailable) {
        if (!primary) {
          primary = member;
        } else if (!secondary) {
          secondary = member;
          break;
        }
      }
    }

    if (!primary) {
      return {
        teamId: team.id,
        escalationTimeoutMinutes: team.escalationTimeoutMinutes,
        chain: [],
      };
    }

    if (!secondary) {
      secondary = primary;
    }

    return {
      teamId: team.id,
      escalationTimeoutMinutes: team.escalationTimeoutMinutes,
      chain: [
        { ...primary.user, position: "PRIMARY" },
        { ...secondary.user, position: "SECONDARY" },
      ],
    };
  }

  async getUserOnCallStatus(teamId: string, userId: string) {
    const now = new Date();
    const [team, totalAssignedIncidents, totalUnacknowledgedIncidents] =
      await Promise.all([
        this.prisma.team.findUnique({
          where: { id: teamId },
          include: {
            teamMembers: {
              orderBy: { joinedAt: "asc" },
              select: {
                user: {
                  select: {
                    id: true,
                  },
                },
                unavailabilities: {
                  where: {
                    startDate: { lte: now },
                    endDate: { gte: now },
                    confirmed: true,
                    status: "APPROVED",
                  },
                },
              },
            },
          },
        }),
        this.prisma.incident.count({
          where: {
            assignedToId: userId,
            status: { not: INCIDENT_STATUS.RESOLVED },
          },
        }),
        this.prisma.incident.count({
          where: {
            assignedToId: userId,
            acknowledgedAt: null,
          },
        }),
      ]);

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    const members = team.teamMembers;
    const totalMembers = members.length;

    type Member = (typeof members)[0];
    let primary: Member | null = null;
    let secondary: Member | null = null;

    for (let i = 0; i < totalMembers; i++) {
      const currentRotationIndex =
        (team.currentRotationIndex + i) % totalMembers;
      const member = members[currentRotationIndex];

      const isAvailable = member.unavailabilities.length === 0;

      if (isAvailable) {
        if (!primary) {
          primary = member;
        } else if (!secondary) {
          secondary = member;
          break;
        }
      }
    }

    const baseDate = new Date(
      Math.max(team.lastRotatedAt.getTime(), team.rotationStartDate.getTime())
    );
    if (primary && primary.user.id === userId) {
      return {
        isOnCall: true,
        currentShift: {
          team: {
            id: team.id,
            name: team.name,
            escalationTimeoutMinutes: team.escalationTimeoutMinutes,
          },
          position: "PRIMARY",
          startsAt: baseDate,
          endsAt: this.addDays(baseDate, team.rotationPeriodDays),
          incidents: {
            totalAssignedIncidents,
            totalUnacknowledgedIncidents,
          },
        },
      };
    } else if (secondary && secondary.user.id === userId) {
      return {
        isOnCall: false,
        currentShift: {
          team: {
            id: team.id,
            name: team.name,
            escalationTimeoutMinutes: team.escalationTimeoutMinutes,
          },
          position: "SECONDARY",
          startsAt: this.addDays(baseDate, team.rotationPeriodDays),
          endsAt: this.addDays(baseDate, team.rotationPeriodDays * 2),
          incidents: {
            totalAssignedIncidents,
            totalUnacknowledgedIncidents,
          },
        },
      };
    }
    return {
      isOnCall: false,
      currentShift: null,
    };
  }

  async getUpcomingRotations(ownerId: string, teamId: string) {
    const now = new Date();
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, ownerId },
      include: {
        teamMembers: {
          orderBy: { joinedAt: "asc" },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                specialty: true,
                role: true,
              },
            },
            unavailabilities: {
              where: {
                endDate: { gte: now },
                confirmed: true,
                status: "APPROVED",
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    if (team.teamMembers.length === 0) {
      return null;
    }

    const members = team.teamMembers;
    const totalMembers = members.length;
    const baseTime = new Date(
      Math.max(team.lastRotatedAt.getTime(), team.rotationStartDate.getTime())
    );
    type User = (typeof members)[0]["user"];
    const upcomingRotations: (User & { startDate: Date; endDate: Date })[] = [];

    // start from 1 to skip the current on-call engineer
    for (let i = 1; i < totalMembers && upcomingRotations.length < 5; i++) {
      const member = members[(team.currentRotationIndex + i) % totalMembers];

      const startDate = this.addDays(baseTime, team.rotationPeriodDays * i);
      const endDate = this.addDays(startDate, team.rotationPeriodDays);

      // available only if no approved leave overlaps their own slot
      const isAvailable = !member.unavailabilities.some(
        (u) => u.startDate < endDate && u.endDate > startDate
      );

      if (isAvailable) {
        upcomingRotations.push({ ...member.user, startDate, endDate });
      }
    }

    return upcomingRotations;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processRotations() {
    const teams = await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
        lastRotatedAt: true,
        currentRotationIndex: true,
        rotationPeriodDays: true,
        rotationStartDate: true,
        _count: {
          select: { teamMembers: true },
        },
        teamMembers: {
          select: {
            userId: true,
          },
        },
      },
    });

    const now = new Date();

    for (const team of teams) {
      if (now < team.rotationStartDate) {
        continue;
      }

      const totalTeamMembers = team._count.teamMembers;
      if (totalTeamMembers === 0) {
        continue;
      }

      const baseTime = Math.max(
        team.lastRotatedAt.getTime(),
        team.rotationStartDate.getTime()
      );
      const daysSinceLastRotation =
        (now.getTime() - baseTime) / (1000 * 60 * 60 * 24);

      // A rotation is due: advance the index.
      if (daysSinceLastRotation >= team.rotationPeriodDays) {
        const outgoingIndex = team.currentRotationIndex;
        const incomingIndex = (outgoingIndex + 1) % totalTeamMembers;

        await this.prisma.team.updateMany({
          where: {
            id: team.id,
            lastRotatedAt: team.lastRotatedAt,
          },
          data: {
            lastRotatedAt: now,
            currentRotationIndex: incomingIndex,
          },
        });
      }
    }
  }
}
