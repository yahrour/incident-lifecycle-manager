import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";
import { CreateUnavailabilityDto, UpdateUnavailabilityDto } from "../dto";

@Injectable()
export class UnavailabilityService {
  constructor(private prisma: PrismaService) {}

  private async verifyTeamOwnership(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.owner_id !== ownerId) {
      throw new NotFoundException("Team doesn't exist");
    }

    return team;
  }

  private async verifyMemberInTeam(teamId: string, memberId: number) {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        team_id: teamId,
        id: memberId,
      },
    });

    if (!member) {
      throw new NotFoundException("Member doesn't belong to the team");
    }

    return member;
  }

  async create(
    ownerId: string,
    teamId: string,
    memberId: number,
    createUnavailabilityDto: CreateUnavailabilityDto
  ) {
    await this.verifyTeamOwnership(teamId, ownerId);
    await this.verifyMemberInTeam(teamId, memberId);

    if (createUnavailabilityDto.startDate >= createUnavailabilityDto.endDate) {
      throw new BadRequestException(
        "end date should be greater than start date"
      );
    }

    try {
      const unavailability = await this.prisma.unavailability.create({
        data: {
          member_id: memberId,
          start_date: createUnavailabilityDto.startDate,
          end_date: createUnavailabilityDto.endDate,
          reason: createUnavailabilityDto.reason,
        },
      });

      return unavailability;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Unavailability window already exist");
      }

      throw error;
    }
  }

  async update(
    ownerId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number,
    updateUnavailabilityDto: UpdateUnavailabilityDto
  ) {
    await this.verifyTeamOwnership(teamId, ownerId);
    await this.verifyMemberInTeam(teamId, memberId);

    if (updateUnavailabilityDto.startDate >= updateUnavailabilityDto.endDate) {
      throw new BadRequestException(
        "end date should be greater than start date"
      );
    }

    try {
      const unavailability = await this.prisma.unavailability.update({
        where: { id: unavailabilityId, member_id: memberId },
        data: {
          start_date: updateUnavailabilityDto.startDate,
          end_date: updateUnavailabilityDto.endDate,
          reason: updateUnavailabilityDto.reason,
        },
      });

      return unavailability;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Unavailability doesn't exist");
        }
        if (error.code === "P2002") {
          throw new ConflictException("Unavailability window already exists");
        }
      }

      throw error;
    }
  }

  async findMemberAll(ownerId: string, teamId: string, memberId: number) {
    await this.verifyTeamOwnership(teamId, ownerId);
    await this.verifyMemberInTeam(teamId, memberId);

    // fetch unavailabilities
    const unavailabilities = await this.prisma.unavailability.findMany({
      where: {
        member_id: memberId,
      },
    });

    return unavailabilities;
  }

  async findTeamAll(ownerId: string, teamId: string) {
    await this.verifyTeamOwnership(teamId, ownerId);

    // fetch unavailabilities
    const teamUnavailabilities = await this.prisma.teamMember.findMany({
      where: {
        team_id: teamId,
      },
      omit: {
        id: true,
        team_id: true,
        joined_at: true,
      },
      include: {
        unavailabilities: {
          omit: {
            created_at: true,
          },
        },
      },
    });

    return teamUnavailabilities;
  }

  async removeAll(ownerId: string, teamId: string, memberId: number) {
    await this.verifyTeamOwnership(teamId, ownerId);
    await this.verifyMemberInTeam(teamId, memberId);

    // Delete member unavailabilities
    await this.prisma.unavailability.deleteMany({
      where: {
        member_id: memberId,
      },
    });
  }

  async removeOne(
    ownerId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    await this.verifyTeamOwnership(teamId, ownerId);
    await this.verifyMemberInTeam(teamId, memberId);

    try {
      // Delete member unavailabilities
      await this.prisma.unavailability.delete({
        where: {
          id: unavailabilityId,
          member_id: memberId,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Unavailability doesn't exist");
      }

      throw error;
    }
  }
}
