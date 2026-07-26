import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";
import { CreateUnavailabilityDto, UpdateUnavailabilityDto } from "./dto";
import { PrismaService } from "src/common/prisma/prisma.service";

@Injectable()
export class UnavailabilityService {
  constructor(private prisma: PrismaService) {}

  private async verifyTeamOwnership(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.ownerId !== ownerId) {
      throw new NotFoundException("Team doesn't exist");
    }

    return team;
  }

  async create(
    requesterUserId: string,
    teamId: string,
    teamMemberId: number,
    dto: CreateUnavailabilityDto
  ) {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    const targetMember = await this.prisma.teamMember.findUnique({
      where: { id: teamMemberId, teamId },
      include: { team: true },
    });

    if (!targetMember) throw new NotFoundException("Team member not found");

    const isSelf = targetMember.userId === requesterUserId;
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    // If they aren't the person taking leave, AND they aren't the owner... block it.
    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException(
        "You can only log unavailability for yourself."
      );
    }
    // if the requester is the team owner, allow them to create the unavailability automatically confirmed
    try {
      return this.prisma.unavailability.create({
        data: {
          memberId: teamMemberId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          reason: dto.reason,
          confirmed: isTeamOwner,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Unavailability window already exists");
      }
      throw error;
    }
  }

  async update(
    requesterUserId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number,
    updateUnavailabilityDto: UpdateUnavailabilityDto
  ) {
    if (
      updateUnavailabilityDto.startDate &&
      updateUnavailabilityDto.endDate &&
      updateUnavailabilityDto.startDate >= updateUnavailabilityDto.endDate
    ) {
      throw new BadRequestException(
        "end date should be greater than start date"
      );
    }

    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        id: memberId,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!targetMember) {
      throw new NotFoundException("Team member not found in this team");
    }

    const isSelf = targetMember.userId === requesterUserId;
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException(
        "You don't have permission to update this unavailability."
      );
    }

    try {
      const currentUnavailability = await this.prisma.unavailability.findUnique(
        {
          where: { id: unavailabilityId, memberId },
        }
      );
      if (!currentUnavailability) {
        throw new NotFoundException("Unavailability doesn't exist");
      }
      // don't let the sre update an engineer unavailability if it's confirmed:false
      if (currentUnavailability.confirmed === false && isTeamOwner) {
        throw new ForbiddenException(
          "Unavailability must be confirmed before updating."
        );
      }
      if (!(
        updateUnavailabilityDto.startDate && updateUnavailabilityDto.endDate
      )) {
        if (updateUnavailabilityDto.startDate) {
          if (
            updateUnavailabilityDto.startDate >= currentUnavailability.endDate
          ) {
            throw new BadRequestException("Start date must be before end date");
          }
        }
        if (updateUnavailabilityDto.endDate) {
          if (
            updateUnavailabilityDto.endDate <= currentUnavailability.startDate
          ) {
            throw new BadRequestException("End date must be after start date");
          }
        }
      }

      const unavailability = await this.prisma.unavailability.update({
        where: { id: unavailabilityId, memberId },
        data: {
          startDate: updateUnavailabilityDto.startDate,
          endDate: updateUnavailabilityDto.endDate,
          reason: updateUnavailabilityDto.reason,
          confirmed: isTeamOwner,
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

  async findMemberAll(
    requesterUserId: string,
    teamId: string,
    memberId: number
  ) {
    // 1. Fetch the target member and their team context for authorization
    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        id: memberId,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!targetMember) {
      throw new NotFoundException("Team member not found in this team");
    }

    // 2. Core Authorization Logic (Strict)
    const isSelf = targetMember.userId === requesterUserId;
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException(
        "You don't have permission to view these unavailabilities."
      );
    }

    // 3. Fetch unavailabilities
    const unavailabilities = await this.prisma.unavailability.findMany({
      where: {
        memberId,
      },
    });

    return unavailabilities;
  }

  async findTeamAll(ownerId: string, teamId: string) {
    await this.verifyTeamOwnership(teamId, ownerId);

    // fetch unavailabilities
    const teamUnavailabilities = await this.prisma.teamMember.findMany({
      where: {
        teamId,
      },
      omit: {
        id: true,
        teamId: true,
        joinedAt: true,
      },
      include: {
        unavailabilities: true,
      },
    });

    return teamUnavailabilities;
  }

  async removeAll(requesterUserId: string, teamId: string, memberId: number) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        id: memberId,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!targetMember) {
      throw new NotFoundException("Team member not found in this team");
    }

    const isSelf = targetMember.userId === requesterUserId;
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException(
        "You don't have permission to delete these unavailabilities."
      );
    }

    await this.prisma.unavailability.deleteMany({
      where: {
        memberId,
      },
    });
  }

  async removeOne(
    requesterUserId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        id: memberId,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!targetMember) {
      throw new NotFoundException("Team member not found in this team");
    }

    const isSelf = targetMember.userId === requesterUserId;
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException(
        "You don't have permission to delete this unavailability."
      );
    }

    try {
      await this.prisma.unavailability.delete({
        where: {
          id: unavailabilityId,
          memberId,
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

  async findPending(ownerId: string, teamId: string) {
    await this.verifyTeamOwnership(teamId, ownerId);

    const teamMembers = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        team: { ownerId },
      },
      include: {
        unavailabilities: {
          where: {
            confirmed: false,
          },
        },
      },
    });

    const pendingUnavailabilities = teamMembers.flatMap(
      (member) => member.unavailabilities ?? []
    );
    return pendingUnavailabilities;
  }

  async confirm(
    requesterUserId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    const team = await this.prisma.team.findUnique({
      where: {
        id: teamId,
        ownerId: requesterUserId,
      },
      include: {
        teamMembers: {
          where: {
            id: memberId,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    if (team.teamMembers.length === 0) {
      throw new NotFoundException("Team member not found");
    }

    const unavailability = await this.prisma.unavailability.findUnique({
      where: {
        id: unavailabilityId,
        memberId,
      },
    });

    if (!unavailability) {
      throw new NotFoundException("Unavailability not found");
    }

    if (unavailability.confirmed) {
      throw new BadRequestException("Unavailability is already confirmed");
    }

    await this.prisma.unavailability.update({
      where: {
        id: unavailabilityId,
        memberId,
      },
      data: {
        confirmed: true,
      },
    });
  }
}
