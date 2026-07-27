import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { OnCallService } from "src/modules/organization/oncall/oncall.service";

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private onCallService: OnCallService
  ) {}

  private async getTeamsTotalAndMembersCount(ownerId: string) {
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

  private async getTeamsCurrentOnCall(ownerId: string) {
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
    });

    if (teams.length === 0) {
      return [];
    }

    return Promise.all(
      teams.map(async (team) => {
        const activeMember = await this.onCallService.getCurrentOnCall(
          team.id,
          ownerId
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

  private async getMembersUnavailabilitiesCounts(ownerId: string) {
    const now = new Date();

    const totalUnavailabilities = await this.prisma.unavailability.count({
      where: {
        teamMember: { team: { ownerId } },
        confirmed: true,
      },
    });

    const activeUnavailabilities = await this.prisma.unavailability.count({
      where: {
        teamMember: { team: { ownerId } },
        startDate: { lte: now },
        endDate: { gte: now },
        confirmed: true,
      },
    });

    return { totalUnavailabilities, activeUnavailabilities };
  }

  async collect(ownerId: string) {
    const [
      { totalTeams, teamsMembersCounts },
      teamsCurrentOnCall,
      { totalUnavailabilities, activeUnavailabilities },
    ] = await Promise.all([
      this.getTeamsTotalAndMembersCount(ownerId),
      this.getTeamsCurrentOnCall(ownerId),
      this.getMembersUnavailabilitiesCounts(ownerId),
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
