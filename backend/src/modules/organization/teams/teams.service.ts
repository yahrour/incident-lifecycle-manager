import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import {
  CreateTeamDto,
  OffsetPaginationSearchParams,
  UpdateTeamDto,
} from "./dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { convertDateToUtc } from "@/common/utils/timezone";
import { Prisma } from "@/generated/prisma/client";

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createTeamDto: CreateTeamDto) {
    try {
      const team = await this.prisma.team.create({
        data: {
          ownerId,
          name: createTeamDto.name,
          description: createTeamDto.description,
          services: createTeamDto.services,
          rotationPeriodDays: createTeamDto.rotationPeriodDays,
          rotationStartDate:
            createTeamDto.rotationStartDate &&
            convertDateToUtc(
              createTeamDto.rotationStartDate,
              createTeamDto.timezone
            ),
          escalationTimeoutMinutes: createTeamDto.escalationTimeoutMinutes,
        },
        omit: {
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return team;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Team already exists");
        }
      }

      throw error;
    }
  }

  async update(ownerId: string, id: string, updateTeamDto: UpdateTeamDto) {
    const data: Prisma.TeamUpdateInput = {
      ...updateTeamDto,
      ...(updateTeamDto.rotationPeriodDays !== undefined && {
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
      }),
    };

    try {
      const updatedTeam = await this.prisma.team.update({
        where: {
          id,
          ownerId,
        },
        data,
        omit: {
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedTeam;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Team doesn't exist");
        }
        if (error.code === "P2002") {
          throw new ConflictException("Team already exists");
        }
      }

      throw error;
    }
  }

  async findAllForOwner(ownerId: string, query: OffsetPaginationSearchParams) {
    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: {
          ownerId,
          ...(query.search && {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          }),
        },
        skip: query.offset,
        take: query.limit,
        ...(query.sortField && {
          orderBy: {
            [query.sortField]: query.sortOrder,
          },
        }),
        omit: {
          ownerId: true,
          updatedAt: true,
          currentRotationIndex: true,
        },
      }),
      this.prisma.team.count({
        where: {
          ownerId,
          ...(query.search && {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          }),
        },
      }),
    ]);

    return { teams, total };
  }

  async findOne(ownerId: string, id: string) {
    const team = await this.prisma.team.findUnique({
      where: {
        id,
        ownerId,
      },
      omit: {
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    return team;
  }

  async getStats(ownerId: string, id: string) {
    const now = new Date();
    const [stats, activeUnavailabilityCount] = await Promise.all([
      this.prisma.team.findUnique({
        where: {
          id,
          ownerId,
        },
        select: {
          _count: {
            select: {
              incidents: {
                where: {
                  status: "open",
                },
              },
              teamMembers: true,
            },
          },
        },
      }),

      this.prisma.unavailability.count({
        where: {
          teamMember: { team: { ownerId }, teamId: id },
          status: "APPROVED",
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
      }),
    ]);

    if (!stats) {
      throw new NotFoundException("Team doesn't exist");
    }

    return {
      memberCount: stats._count.teamMembers,
      openIncidentCount: stats._count.incidents,
      activeUnavailabilityCount,
    };
  }

  async remove(ownerId: string, id: string) {
    try {
      await this.prisma.team.delete({
        where: {
          id,
          ownerId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Team doesn't exist");
        }
      }

      throw error;
    }
  }
}
