import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { OnCallService } from "src/modules/organization/oncall/oncall.service";

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private onCallService: OnCallService
  ) {}

  private async getTotalTeams(ownerId: string) {
    const totalTeams = await this.prisma.team.count({
      where: {
        ownerId,
      },
    });

    return totalTeams;
  }

  private async getTeamsMemberCount(ownerId: string) {
    const result = await this.prisma.team.findMany({
      where: {
        ownerId,
      },
      include: {
        _count: {
          select: {
            teamMembers: true,
          },
        },
      },
    });

    const count = result.map((team) => ({
      id: team.id,
      name: team.name,
      count: team._count.teamMembers,
    }));

    return count;
  }

  private async getTeamsCurrentOnCall(ownerId: string) {
    // 1. Fetch all teams along with their ordered members
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
    });

    return Promise.all(
      teams.map(async (team) => {
        const activeMember = await this.onCallService.getCurrentOnCall(
          team.id,
          ownerId
        );
        const onCallChain = [
          { role: "PRIMARY", userId: activeMember?.chain[0].userId },
          { role: "SECONDARY", userId: activeMember?.chain[1].userId },
        ];
        return {
          id: team.id,
          name: team.name,
          onCall: activeMember ? onCallChain : null,
        };
      })
    );
  }

  private async getMembersUnavailabilitiesCount(ownerId: string) {
    const memberUnavailabilitiesCount = await this.prisma.unavailability.count({
      where: {
        teamMember: { team: { ownerId } },
      },
    });

    return memberUnavailabilitiesCount;
  }

  private async getMembersUnavailabilitiesActiveCount(ownerId: string) {
    const memberUnavailabilitiesActiveCount =
      await this.prisma.unavailability.count({
        where: {
          teamMember: { team: { ownerId } },
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      });

    return memberUnavailabilitiesActiveCount;
  }

  async collect(ownerId: string) {
    const [
      totalTeams,
      teamsMembersCounts,
      teamsCurrentOnCall,
      membersUnavailabilitiesTotal,
      membersUnavailabilitiesActiveTotal,
    ] = await Promise.all([
      this.getTotalTeams(ownerId),
      this.getTeamsMemberCount(ownerId),
      this.getTeamsCurrentOnCall(ownerId),
      this.getMembersUnavailabilitiesCount(ownerId),
      this.getMembersUnavailabilitiesActiveCount(ownerId),
    ]);

    return {
      totalTeams,
      teamsMembersCounts,
      teamsCurrentOnCall,
      membersUnavailabilitiesTotal,
      membersUnavailabilitiesActiveTotal,
    };
  }
}
