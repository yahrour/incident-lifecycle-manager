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
import { Team, TeamMember } from "src/generated/prisma/client";

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

  private verifyAuthority(
    targetMember: TeamMember & { team: Team },
    requesterUserId: string
  ) {
    const isSelf = targetMember.userId === requesterUserId;
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException("Unauthorized action");
    }
  }

  private async getAuthorizedMember(
    teamMemberId: number,
    teamId: string,
    requesterUserId: string
  ) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: { id: teamMemberId, teamId },
      include: { team: true },
    });

    if (!targetMember)
      throw new NotFoundException("Team member not found in this team");

    this.verifyAuthority(targetMember, requesterUserId);

    return targetMember;
  }

  async create(
    requesterUserId: string,
    teamId: string,
    teamMemberId: number,
    createUnavailabilityDto: CreateUnavailabilityDto
  ) {
    if (createUnavailabilityDto.startDate >= createUnavailabilityDto.endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    const targetMember = await this.getAuthorizedMember(
      teamMemberId,
      teamId,
      requesterUserId
    );
    const isTeamOwner = targetMember.team.ownerId === requesterUserId;

    try {
      return await this.prisma.unavailability.create({
        data: {
          memberId: teamMemberId,
          startDate: createUnavailabilityDto.startDate,
          endDate: createUnavailabilityDto.endDate,
          reason: createUnavailabilityDto.reason,
          confirmed: isTeamOwner, // if the requester is the team owner, confirm unavailability automatically
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
    const targetMember = await this.getAuthorizedMember(
      memberId,
      teamId,
      requesterUserId
    );

    if (
      updateUnavailabilityDto.startDate &&
      updateUnavailabilityDto.endDate &&
      updateUnavailabilityDto.startDate >= updateUnavailabilityDto.endDate
    ) {
      throw new BadRequestException(
        "end date should be greater than start date"
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

      if (!(
        updateUnavailabilityDto.startDate && updateUnavailabilityDto.endDate
      )) {
        if (updateUnavailabilityDto.startDate) {
          if (
            updateUnavailabilityDto.startDate >= currentUnavailability.endDate
          ) {
            throw new BadRequestException("Start date must be before end date");
          }
        } else if (updateUnavailabilityDto.endDate) {
          if (
            updateUnavailabilityDto.endDate <= currentUnavailability.startDate
          ) {
            throw new BadRequestException("End date must be after start date");
          }
        }
      }

      const isTeamOwner = targetMember.team.ownerId === requesterUserId;
      const isDateChanged =
        (updateUnavailabilityDto.startDate !== undefined &&
          updateUnavailabilityDto.startDate.getTime() !==
            currentUnavailability.startDate.getTime()) ||
        (updateUnavailabilityDto.endDate !== undefined &&
          updateUnavailabilityDto.endDate.getTime() !==
            currentUnavailability.endDate.getTime());

      return await this.prisma.unavailability.update({
        where: { id: unavailabilityId, memberId },
        data: {
          startDate: updateUnavailabilityDto.startDate,
          endDate: updateUnavailabilityDto.endDate,
          reason: updateUnavailabilityDto.reason,
          confirmed: isTeamOwner
            ? true
            : isDateChanged
              ? false
              : currentUnavailability.confirmed,
        },
      });
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
    await this.getAuthorizedMember(memberId, teamId, requesterUserId);

    const unavailabilities = await this.prisma.unavailability.findMany({
      where: {
        memberId,
      },
    });

    return unavailabilities;
  }

  async findTeamAll(requesterId: string, teamId: string) {
    await this.verifyTeamOwnership(teamId, requesterId);

    const teamUnavailabilities = await this.prisma.teamMember.findMany({
      where: {
        teamId,
      },
      include: {
        unavailabilities: true,
      },
    });

    return teamUnavailabilities;
  }

  async removeMemberAll(
    requesterUserId: string,
    teamId: string,
    memberId: number
  ) {
    await this.getAuthorizedMember(memberId, teamId, requesterUserId);

    await this.prisma.unavailability.deleteMany({
      where: {
        memberId,
      },
    });
  }

  async removeMemberOne(
    requesterUserId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    await this.getAuthorizedMember(memberId, teamId, requesterUserId);

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

  async findPending(requesterId: string, teamId: string) {
    await this.verifyTeamOwnership(teamId, requesterId);

    const pendingUnavailabilities = await this.prisma.unavailability.findMany({
      where: {
        confirmed: false,
        teamMember: {
          teamId,
          team: { ownerId: requesterId },
        },
      },
    });

    return pendingUnavailabilities;
  }

  async confirm(
    requesterId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    await this.verifyTeamOwnership(teamId, requesterId);
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId, teamId },
    });

    if (!member) {
      throw new NotFoundException("Team member not found in this team");
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
