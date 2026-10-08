import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class OnCallService {
  constructor(private prisma: PrismaService) {}

  async getCurrentOnCall(teamId: string, ownerId: string) {
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

  async getUpcomingRotations(teamId: string, ownerId: string) {
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

    type User = (typeof members)[0]["user"];
    const upcomingRotations: User[] = [];

    // start from 1 to skip the current on-call engineer
    for (let i = 1; i < totalMembers; i++) {
      const currentRotationIndex =
        (team.currentRotationIndex + i) % totalMembers;
      const member = members[currentRotationIndex];

      const isAvailable = member.unavailabilities.length === 0;

      if (isAvailable) {
        upcomingRotations.push(member.user);
      }

      if (upcomingRotations.length === 5) {
        break;
      }
    }

    return upcomingRotations;
  }

  @Cron(CronExpression.EVERY_SECOND)
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
