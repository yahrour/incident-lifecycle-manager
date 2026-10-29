import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import {
  RequestUnavailabilityDto,
  OffsetPaginationSearchParams,
  UpdateUnavailabilityDto,
} from "./dto";
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

  private async requireTeamMembership(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId, userId },
      select: { id: true },
    });

    if (!membership) {
      throw new NotFoundException("Team doesn't exist");
    }
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

    const startDate = convertDateToUtc(
      requestUnavailabilityDto.startDate,
      "UTC"
    );
    const endDate = convertDateToUtc(
      requestUnavailabilityDto.endDate,
      "UTC",
      true
    );

    return await this.prisma.$transaction(async (tx) => {
      // lock this member row
      await tx.$queryRaw`SELECT id FROM "organization"."team_members" WHERE id = ${memberId} FOR UPDATE`;

      const overlapping = await tx.unavailability.findFirst({
        where: {
          memberId,
          status: {
            in: [UnavailabilityStatus.PENDING, UnavailabilityStatus.APPROVED],
          },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      });

      if (overlapping) {
        throw new ConflictException(
          "Unavailability overlaps an existing request"
        );
      }

      try {
        return await tx.unavailability.create({
          data: {
            memberId,
            startDate,
            endDate,
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
    });
  }

  async update(
    requesterUserId: string,
    teamId: string,
    memberId: number,
    unavailabilityId: number,
    updateUnavailabilityDto: UpdateUnavailabilityDto
  ) {
    await this.requireSelfMember(memberId, teamId, requesterUserId);

    const now = new Date();
    if (
      convertDateToUtc(
        updateUnavailabilityDto.startDate,
        updateUnavailabilityDto.timezone,
        true
      ) < now
    ) {
      throw new BadRequestException("Start date can't be in the past");
    }

    const startDate = convertDateToUtc(
      updateUnavailabilityDto.startDate,
      "UTC"
    );
    const endDate = convertDateToUtc(
      updateUnavailabilityDto.endDate,
      "UTC",
      true
    );

    const currentUnavailability = await this.prisma.unavailability.findUnique({
      where: { id: unavailabilityId, memberId },
    });

    if (!currentUnavailability) {
      throw new NotFoundException("Unavailability doesn't exist");
    }

    if (updateUnavailabilityDto.startDate > updateUnavailabilityDto.endDate) {
      throw new BadRequestException(
        "end date should be greater than start date"
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "organization"."team_members" WHERE id = ${memberId} FOR UPDATE`;

      const overlapping = await tx.unavailability.findFirst({
        where: {
          memberId,
          id: { not: unavailabilityId },
          status: {
            in: [UnavailabilityStatus.PENDING, UnavailabilityStatus.APPROVED],
          },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      });

      if (overlapping) {
        throw new ConflictException(
          "Unavailability overlaps an existing request"
        );
      }

      try {
        const result = await tx.unavailability.updateMany({
          where: {
            id: unavailabilityId,
            memberId,
            status: UnavailabilityStatus.PENDING,
          },
          data: { startDate, endDate, reason: updateUnavailabilityDto.reason },
        });

        if (result.count === 0) {
          throw new ConflictException(
            "Unavailability was modified or removed by another request"
          );
        }
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ConflictException("Unavailability window already exists");
        }
        throw error;
      }
    });
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
        status: UnavailabilityStatus.PENDING,
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

  async findTeammatesAway(requesterId: string, teamId: string) {
    await this.requireTeamMembership(teamId, requesterId);

    const active = {
      status: UnavailabilityStatus.APPROVED,
      endDate: { gte: new Date() },
    } as const;

    return this.prisma.teamMember.findMany({
      where: {
        teamId,
        NOT: { userId: requesterId },
        unavailabilities: { some: active },
      },
      select: {
        user: { select: { firstName: true, lastName: true, specialty: true } },
        unavailabilities: {
          where: active,
          select: { startDate: true, endDate: true },
          orderBy: { startDate: "asc" },
        },
      },
    });
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

    if (unavailability.status !== UnavailabilityStatus.PENDING) {
      throw new BadRequestException(
        "Cannot approve a non pending unavailability"
      );
    }

    if (unavailability.endDate < new Date()) {
      throw new BadRequestException(
        "Cannot approve an unavailability that has already ended"
      );
    }

    const result = await this.prisma.unavailability.updateMany({
      where: {
        id: unavailabilityId,
        status: UnavailabilityStatus.PENDING,
        memberId,
      },
      data: {
        status: UnavailabilityStatus.APPROVED,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        "Cannot approve a non pending unavailability"
      );
    }
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

    if (unavailability.status !== UnavailabilityStatus.PENDING) {
      throw new BadRequestException(
        "Cannot reject a non pending unavailability"
      );
    }

    if (unavailability.endDate < new Date()) {
      throw new BadRequestException(
        "Cannot reject an unavailability that has already ended"
      );
    }

    const result = await this.prisma.unavailability.updateMany({
      where: {
        id: unavailabilityId,
        status: UnavailabilityStatus.PENDING,
        memberId,
      },
      data: {
        status: UnavailabilityStatus.REJECTED,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        "Cannot reject a non pending unavailability"
      );
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireOverduePending() {
    const now = new Date();

    await this.prisma.unavailability.updateMany({
      where: {
        status: UnavailabilityStatus.PENDING,
        endDate: {
          lt: now,
        },
      },
      data: {
        status: UnavailabilityStatus.EXPIRED,
      },
    });
  }
}
