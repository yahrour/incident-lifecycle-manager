import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/common/prisma/prisma.service";
import { DiscordService } from "@/modules/discord/discord.service";

@Injectable()
export class OnCallService {
  constructor(
    private prisma: PrismaService,
    private discordService: DiscordService
  ) {}

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

  @Cron(CronExpression.EVERY_SECOND)
  async processRotations() {
    const teams = await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
        lastRotatedAt: true,
        currentRotationIndex: true,
        lastNotifiedRotationIndex: true,
        rotationPeriodDays: true,
        rotationStartDate: true,
        webhookUrl: true,
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

      // A rotation is due: advance the index and notify the outgoing and incoming engineers.
      if (daysSinceLastRotation >= team.rotationPeriodDays) {
        console.log(`Rotation due for team ${team.id}`);
        const outgoingIndex = team.currentRotationIndex;
        const incomingIndex = (outgoingIndex + 1) % totalTeamMembers;

        const result = await this.prisma.team.updateMany({
          where: {
            id: team.id,
            lastRotatedAt: team.lastRotatedAt,
          },
          data: {
            lastRotatedAt: now,
            currentRotationIndex: incomingIndex,
            lastNotifiedRotationIndex: incomingIndex,
          },
        });

        if (result.count === 0) {
          continue;
        }

        await this.notifyMember(
          team,
          team.teamMembers[incomingIndex],
          `You are on call for **${team.name}** starting today for ${team.rotationPeriodDays} days`
        );

        continue;
      }

      // No rotation is due yet, but the current on-call engineer may not have been
      // notified yet (e.g. right after the team was created). Notify them once.
      if (team.lastNotifiedRotationIndex !== team.currentRotationIndex) {
        await this.prisma.team.update({
          where: { id: team.id },
          data: { lastNotifiedRotationIndex: team.currentRotationIndex },
        });

        await this.notifyMember(
          team,
          team.teamMembers[team.currentRotationIndex],
          `You are on call for **${team.name}** starting today for ${team.rotationPeriodDays} days`
        );
      }
    }
  }

  private async notifyMember(
    team: {
      id: string;
      name: string;
      webhookUrl: string | null;
      teamMembers: { userId: string }[];
    },
    member: { userId: string } | undefined,
    message: string
  ) {
    if (!team.webhookUrl || !member) {
      return;
    }

    const userDiscordId = (
      await this.prisma.user.findUnique({
        where: { id: member.userId },
      })
    )?.discordId;

    if (!userDiscordId) {
      return;
    }

    await this.discordService.sendWebhookNotification(team.webhookUrl, {
      content: `<@${userDiscordId}> ${message}`,
    });
  }
}
