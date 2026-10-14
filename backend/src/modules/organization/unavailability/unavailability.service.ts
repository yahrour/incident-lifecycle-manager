import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { RequestUnavailabilityDto, OffsetPaginationSearchParams } from "./dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import {
  Team,
  TeamMember,
  UnavailabilityStatus,
} from "@/generated/prisma/client";
import { convertDateToUtc } from "@/common/utils/timezone";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FILTER_FIELD } from "./constants";

@Injectable()
export class UnavailabilityService {
  constructor(private prisma: PrismaService) {}

  // FILTER_FIELD is lowercase ("pending"), the Prisma enum is uppercase
  private buildStatusWhere(filterField: FILTER_FIELD) {
    return filterField === FILTER_FIELD.ALL
      ? {}
      : { status: filterField.toUpperCase() as UnavailabilityStatus };
  }

  private async requireOwnedTeam(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.ownerId !== ownerId) {
      throw new NotFoundException("Team doesn't exist");
    }

    return team;
  }

  private assertSelfOrOwner(
    targetMember: TeamMember & { team: Team },
    requesterId: string
  ) {
    const isSelf = targetMember.userId === requesterId;
    const isTeamOwner = targetMember.team.ownerId === requesterId;

    if (!isSelf && !isTeamOwner) {
      throw new ForbiddenException("Unauthorized action");
    }
  }

  private async requireMemberAccess(
    memberId: number,
    teamId: string,
    requesterId: string
  ) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: { id: memberId, teamId },
      include: { team: true },
    });
    if (!targetMember)
      throw new NotFoundException("Team member not found in this team");

    this.assertSelfOrOwner(targetMember, requesterId);

    return targetMember;
  }

  private assertIsSelf(targetMember: TeamMember, requesterId: string) {
    if (targetMember.userId !== requesterId) {
      throw new ForbiddenException(
        "You can only manage your own unavailability"
      );
    }
  }

  private async requireSelfMember(
    memberId: number,
    teamId: string,
    requesterId: string
  ) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: { id: memberId, teamId },
    });

    if (!targetMember)
      throw new NotFoundException("Team member not found in this team");

    this.assertIsSelf(targetMember, requesterId);

    return targetMember;
  }

  async request(
    requesterId: string,
    teamId: string,
    memberId: number,
    requestUnavailabilityDto: RequestUnavailabilityDto
  ) {
    await this.requireSelfMember(memberId, teamId, requesterId);

    const now = new Date();
    if (
      convertDateToUtc(
        requestUnavailabilityDto.startDate,
        requestUnavailabilityDto.timezone,
        true
      ) < now
    ) {
      throw new BadRequestException("Start date can't be in the past");
    }
    if (requestUnavailabilityDto.startDate > requestUnavailabilityDto.endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    try {
      return await this.prisma.unavailability.create({
        data: {
          memberId,
          startDate: convertDateToUtc(
            requestUnavailabilityDto.startDate,
            requestUnavailabilityDto.timezone
          ),
          endDate: convertDateToUtc(
            requestUnavailabilityDto.endDate,
            requestUnavailabilityDto.timezone,
            true
          ),
          reason: requestUnavailabilityDto.reason,
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

  async findByMember(
    requesterId: string,
    teamId: string,
    memberId: number,
    query: OffsetPaginationSearchParams
  ) {
    await this.requireMemberAccess(memberId, teamId, requesterId);

    const [unavailabilities, total] = await Promise.all([
      this.prisma.unavailability.findMany({
        where: {
          memberId,
          ...this.buildStatusWhere(query.filterField),
        },
        ...(query.sortField && {
          orderBy: [
            { [query.sortField]: query.sortOrder },
            { id: query.sortOrder },
          ],
        }),
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.unavailability.count({
        where: {
          memberId,
          ...this.buildStatusWhere(query.filterField),
        },
      }),
    ]);

    return { unavailabilities, total };
  }

  async cancel(
    requesterId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    await this.requireMemberAccess(memberId, teamId, requesterId);

    const result = await this.prisma.unavailability.deleteMany({
      where: {
        id: unavailabilityId,
        memberId,
        status: "PENDING",
      },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        "Unavailability doesn't exist or isn't pending"
      );
    }
  }

  async findByTeam(
    requesterId: string,
    teamId: string,
    query: OffsetPaginationSearchParams
  ) {
    await this.requireOwnedTeam(teamId, requesterId);

    try {
      const [unavailabilities, total] = await Promise.all([
        this.prisma.unavailability.findMany({
          where: {
            teamMember: {
              teamId,
              team: { ownerId: requesterId },
            },
            ...this.buildStatusWhere(query.filterField),
          },
          include: {
            teamMember: {
              select: {
                id: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
              },
            },
          },
          skip: query.offset,
          take: query.limit,
          ...(query.sortField && {
            orderBy: [
              { [query.sortField]: query.sortOrder },
              { id: query.sortOrder },
            ],
          }),
        }),
        this.prisma.unavailability.count({
          where: {
            teamMember: {
              teamId,
              team: { ownerId: requesterId },
            },
            ...this.buildStatusWhere(query.filterField),
          },
        }),
      ]);

      return { unavailabilities, total };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          "Cursor references a no-longer-existing unavailability"
        );
      }
      throw error;
    }
  }

  async findAllForOwner(
    requesterId: string,
    query: OffsetPaginationSearchParams
  ) {
    const [unavailabilities, total] = await Promise.all([
      this.prisma.unavailability.findMany({
        where: {
          teamMember: {
            team: { ownerId: requesterId },
          },
          ...this.buildStatusWhere(query.filterField),
        },
        include: {
          teamMember: {
            select: {
              id: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
            },
          },
        },
        skip: query.offset,
        take: query.limit,
        ...(query.sortField && {
          orderBy: [
            { [query.sortField]: query.sortOrder },
            { id: query.sortOrder },
          ],
        }),
      }),
      this.prisma.unavailability.count({
        where: {
          teamMember: {
            team: { ownerId: requesterId },
          },
          ...this.buildStatusWhere(query.filterField),
        },
      }),
    ]);

    return { unavailabilities, total };
  }

  async approve(
    requesterId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    await this.requireOwnedTeam(teamId, requesterId);
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

    if (unavailability.status === "APPROVED") {
      throw new BadRequestException("Unavailability is already approved");
    }
    if (unavailability.status === "REJECTED") {
      throw new BadRequestException("Cannot approve a rejected unavailability");
    }
    if (unavailability.status === "EXPIRED") {
      throw new BadRequestException("Cannot approve an expired unavailability");
    }

    await this.prisma.unavailability.update({
      where: {
        id: unavailabilityId,
        memberId,
      },
      data: {
        confirmed: true,
        status: "APPROVED",
      },
    });
  }

  async reject(
    requesterId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number
  ) {
    await this.requireOwnedTeam(teamId, requesterId);
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

    if (unavailability.status === "APPROVED") {
      throw new BadRequestException("Cannot reject an approved unavailability");
    }
    if (unavailability.status === "REJECTED") {
      throw new BadRequestException("Unavailability is already rejected");
    }
    if (unavailability.status === "EXPIRED") {
      throw new BadRequestException("Cannot reject an expired unavailability");
    }

    await this.prisma.unavailability.update({
      where: {
        id: unavailabilityId,
        memberId,
      },
      data: {
        confirmed: false,
        status: "REJECTED",
      },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireOverduePending() {
    const now = new Date();

    await this.prisma.unavailability.updateMany({
      where: {
        status: "PENDING",
        endDate: {
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });
  }
}
