import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OnCallService {
  constructor(private prisma: PrismaService) {}

  async getCurrentOnCall(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, ownerId },
      include: {
        teamMembers: {
          orderBy: { joinedAt: "asc" },
          select: {
            userId: true,
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

    const primary =
      team.teamMembers[team.currentRotationIndex % team.teamMembers.length];
    const secondary =
      team.teamMembers[
        (team.currentRotationIndex + 1) % team.teamMembers.length
      ];

    const data = {
      teamId: team.id,
      escalationTimeoutMinutes: team.escalationTimeoutMinutes,
      chain: [
        { role: "PRIMARY", userId: primary.userId },
        { role: "SECONDARY", userId: secondary.userId },
      ],
    };

    return data;
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
        team.rotationStartDate.getTime()
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
