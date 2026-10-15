import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { OnCallService } from "@/modules/on-call/on-call.service";

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private onCallService: OnCallService
  ) {}

  private async getTeamsAndMembersCounts(ownerId: string) {
    const result = await this.prisma.team.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: {
            teamMembers: true,
          },
        },
      },
    });

    const teamsCount = result.length;
    const teamsMembersCount = result.map((team) => ({
      id: team.id,
      name: team.name,
      count: team._count.teamMembers,
    }));

    return { totalTeams: teamsCount, teamsMembersCounts: teamsMembersCount };
  }

  private async getCurrentOnCallForTeams(ownerId: string) {
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
    });

    if (teams.length === 0) {
      return [];
    }

    return Promise.all(
      teams.map(async (team) => {
        const activeMember = await this.onCallService.getCurrentOnCall(
          ownerId,
          team.id
        );
        const onCallChain = activeMember?.chain.length
          ? activeMember.chain
          : [];
        return {
          id: team.id,
          name: team.name,
          onCall: onCallChain,
        };
      })
    );
  }

  private async getMembersUnavailabilityCounts(ownerId: string) {
    const now = new Date();

    const totalUnavailabilities = await this.prisma.unavailability.count({
      where: {
        teamMember: { team: { ownerId } },
        status: "APPROVED",
      },
    });

    const activeUnavailabilities = await this.prisma.unavailability.count({
      where: {
        teamMember: { team: { ownerId } },
        startDate: { lte: now },
        endDate: { gte: now },
        status: "APPROVED",
      },
    });

    return { totalUnavailabilities, activeUnavailabilities };
  }

  async collectMetrics(ownerId: string) {
    const [
      { totalTeams, teamsMembersCounts },
      teamsCurrentOnCall,
      { totalUnavailabilities, activeUnavailabilities },
    ] = await Promise.all([
      this.getTeamsAndMembersCounts(ownerId),
      this.getCurrentOnCallForTeams(ownerId),
      this.getMembersUnavailabilityCounts(ownerId),
    ]);

    return {
      totalTeams,
      teamsMembersCounts,
      teamsCurrentOnCall,
      totalUnavailabilities,
      activeUnavailabilities,
    };
  }
}
