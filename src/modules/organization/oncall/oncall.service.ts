import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "src/common/prisma/prisma.service";

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
            userId: true,
            unavailabilities: {
              where: {
                startDate: { lte: now },
                endDate: { gte: now },
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
        { role: "PRIMARY", userId: primary.userId },
        { role: "SECONDARY", userId: secondary.userId },
      ],
    };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processRotations() {
    const teams = await this.prisma.team.findMany({
      select: {
        id: true,
        lastRotatedAt: true,
        currentRotationIndex: true,
        rotationPeriodDays: true,
        rotationStartDate: true,
        _count: {
          select: { teamMembers: true },
        },
      },
    });

    const now = new Date();

    for (const team of teams) {
      if (now < team.rotationStartDate) {
        continue;
      }

      const baseTime = Math.max(
        team.lastRotatedAt.getTime(),
        team.rotationStartDate.getTime(),
      );
      const daysSinceLastRotation =
        (now.getTime() - baseTime) / (1000 * 60 * 60 * 24);

      if (daysSinceLastRotation >= team.rotationPeriodDays) {
        const totalTeamMembers = team._count.teamMembers;

        if (totalTeamMembers === 0) {
          continue;
        }

        await this.prisma.team.update({
          where: { id: team.id },
          data: {
            lastRotatedAt: now,
            currentRotationIndex:
              (team.currentRotationIndex + 1) % totalTeamMembers,
          },
        });

        // TODO: trigger a WEBHOOK to alert on-call engineer that his on-call for X rotationPeriodDays
      }
    }
  }
}
