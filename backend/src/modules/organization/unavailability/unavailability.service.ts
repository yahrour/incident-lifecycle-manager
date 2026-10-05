import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import {
  CreateUnavailabilityDto,
  OffsetPaginationSearchParams,
  CursorPaginationSearchParams,
  UpdateUnavailabilityDto,
} from "./dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Team, TeamMember } from "@/generated/prisma/client";
import { Cursor, cursorSchema } from "./types";
import { convertDateToUtc } from "@/common/utils/timezone";
import { Cron, CronExpression } from "@nestjs/schedule";

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

  private verifySelf(targetMember: TeamMember, requesterUserId: string) {
    if (targetMember.userId !== requesterUserId) {
      throw new ForbiddenException(
        "You can only manage your own unavailability"
      );
    }
  }

  private async getSelfMember(
    teamMemberId: number,
    teamId: string,
    requesterUserId: string
  ) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: { id: teamMemberId, teamId },
    });

    if (!targetMember)
      throw new NotFoundException("Team member not found in this team");

    this.verifySelf(targetMember, requesterUserId);

    return targetMember;
  }

  private encodeCursor(cursor: Cursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
  }

  private decodeCursor(raw: string): Cursor {
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    } catch {
      throw new BadRequestException("Invalid cursor");
    }

    const result = cursorSchema.validate(parsed, {
      stripUnknown: true,
    });

    if (result.error) {
      throw new BadRequestException("Invalid cursor");
    }

    return result.value;
  }

  async create(
    requesterUserId: string,
    teamId: string,
    teamMemberId: number,
    createUnavailabilityDto: CreateUnavailabilityDto
  ) {
    if (createUnavailabilityDto.startDate > createUnavailabilityDto.endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    await this.getSelfMember(teamMemberId, teamId, requesterUserId);

    try {
      return await this.prisma.unavailability.create({
        data: {
          memberId: teamMemberId,
          startDate: convertDateToUtc(
            createUnavailabilityDto.startDate,
            createUnavailabilityDto.timezone
          ),
          endDate: convertDateToUtc(
            createUnavailabilityDto.endDate,
            createUnavailabilityDto.timezone,
            true
          ),
          reason: createUnavailabilityDto.reason,
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
    await this.getSelfMember(memberId, teamId, requesterUserId);

    if (
      updateUnavailabilityDto.startDate &&
      updateUnavailabilityDto.endDate &&
      updateUnavailabilityDto.startDate > updateUnavailabilityDto.endDate
    ) {
      throw new BadRequestException(
        "end date should be greater than start date"
      );
    }

    // convert to UTC
    if (updateUnavailabilityDto.startDate) {
      updateUnavailabilityDto.startDate = convertDateToUtc(
        updateUnavailabilityDto.startDate,
        updateUnavailabilityDto.timezone
      );
    }
    if (updateUnavailabilityDto.endDate) {
      updateUnavailabilityDto.endDate = convertDateToUtc(
        updateUnavailabilityDto.endDate,
        updateUnavailabilityDto.timezone,
        true
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

      if (currentUnavailability.status === "EXPIRED") {
        throw new BadRequestException(
          "Cannot update an expired unavailability"
        );
      }

      // if one of the dates is present and the other one is missing
      if (
        (updateUnavailabilityDto.startDate &&
          !updateUnavailabilityDto.endDate) ||
        (!updateUnavailabilityDto.startDate && updateUnavailabilityDto.endDate)
      ) {
        if (updateUnavailabilityDto.startDate) {
          if (
            updateUnavailabilityDto.startDate > currentUnavailability.endDate
          ) {
            throw new BadRequestException("Start date must be before end date");
          }
        } else if (updateUnavailabilityDto.endDate) {
          if (
            updateUnavailabilityDto.endDate < currentUnavailability.startDate
          ) {
            throw new BadRequestException("End date must be after start date");
          }
        }
      }

      return await this.prisma.unavailability.update({
        where: { id: unavailabilityId, memberId },
        data: {
          startDate: updateUnavailabilityDto.startDate,
          endDate: updateUnavailabilityDto.endDate,
          reason: updateUnavailabilityDto.reason,
          confirmed: false,
          status: "PENDING",
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
    memberId: number,
    query: OffsetPaginationSearchParams
  ) {
    await this.getAuthorizedMember(memberId, teamId, requesterUserId);

    const [unavailabilities, total] = await Promise.all([
      this.prisma.unavailability.findMany({
        where: {
          memberId,
        },
        ...(query.sortField && {
          orderBy: {
            [query.sortField]: query.sortOrder,
          },
        }),
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.unavailability.count({
        where: {
          memberId,
        },
      }),
    ]);

    return { unavailabilities, total };
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

  async findTeamAll(
    requesterId: string,
    teamId: string,
    query: CursorPaginationSearchParams
  ) {
    await this.verifyTeamOwnership(teamId, requesterId);

    const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;
    if (
      cursor &&
      (cursor.sortField !== query.sortField ||
        cursor.sortOrder !== query.sortOrder)
    ) {
      throw new BadRequestException(
        "Cursor sort parameters do not match query sort parameters"
      );
    }

    try {
      const teamUnavailabilities = await this.prisma.unavailability.findMany({
        where: {
          teamMember: {
            teamId,
            team: { ownerId: requesterId },
          },
        },
        include: {
          teamMember: {
            select: {
              id: true,
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
        take: query.limit + 1,
        ...(cursor && {
          skip: 1,
          cursor: {
            id: cursor.id,
          },
        }),
        orderBy: [
          {
            [query.sortField]: query.sortOrder,
          },
          { id: query.sortOrder },
        ],
      });

      const hasNextPage = teamUnavailabilities.length > query.limit;
      const unavailabilities = hasNextPage
        ? teamUnavailabilities.slice(0, query.limit)
        : teamUnavailabilities;
      const nextCursor = hasNextPage
        ? this.encodeCursor({
            id: unavailabilities[unavailabilities.length - 1].id,
            sortField: query.sortField,
            sortOrder: query.sortOrder,
          })
        : null;

      return { unavailabilities, nextCursor };
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

  async findPending(
    requesterId: string,
    teamId: string,
    query: OffsetPaginationSearchParams
  ) {
    await this.verifyTeamOwnership(teamId, requesterId);

    const [unavailabilities, total] = await Promise.all([
      this.prisma.unavailability.findMany({
        where: {
          confirmed: false,
          status: "PENDING",
          teamMember: {
            teamId,
            team: { ownerId: requesterId },
          },
        },
        include: {
          teamMember: {
            select: {
              id: true,
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
        ...(query.sortField && {
          orderBy: {
            [query.sortField]: query.sortOrder,
          },
        }),
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.unavailability.count({
        where: {
          confirmed: false,
          status: "PENDING",
          teamMember: {
            teamId,
            team: { ownerId: requesterId },
          },
        },
      }),
    ]);

    return { unavailabilities, total };
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

  @Cron(CronExpression.EVERY_MINUTE)
  async expireStaleUnavailabilities() {
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
