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
          rotationPeriodDays: createTeamDto.rotationPeriodDays,
          rotationStartDate:
            createTeamDto.rotationStartDate &&
            convertDateToUtc(
              createTeamDto.rotationStartDate,
              createTeamDto.timezone
            ),
          escalationTimeoutMinutes: createTeamDto.escalationTimeoutMinutes,
          webhookUrl: createTeamDto.webhookUrl,
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
          throw new ConflictException("Team already exist");
        }
      }

      throw error;
    }
  }

  async update(id: string, ownerId: string, updateTeamDto: UpdateTeamDto) {
    const data: UpdateTeamDto & {
      currentRotationIndex: number | undefined;
      lastNotifiedRotationIndex: number | undefined;
      lastRotatedAt: Date | undefined;
    } = {
      ...updateTeamDto,
      currentRotationIndex: undefined,
      lastNotifiedRotationIndex: undefined,
      lastRotatedAt: undefined,
    };

    if (updateTeamDto.rotationPeriodDays !== undefined) {
      data.currentRotationIndex = 0;
      data.lastNotifiedRotationIndex = -1;
      data.lastRotatedAt = new Date();
    }

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
          throw new NotFoundException();
        }
        if (error.code === "P2002") {
          throw new ConflictException("Team already exist");
        }
      }

      throw error;
    }
  }

  async findAll(ownerId: string, query: OffsetPaginationSearchParams) {
    try {
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
            lastNotifiedRotationIndex: true,
          },
        }),
        this.prisma.team.count({
          where: {
            ownerId,
          },
        }),
      ]);

      return { teams, total };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          "Cursor references a no-longer-existing team"
        );
      }
      throw error;
    }
  }

  async findOne(id: string, ownerId: string) {
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

  async findStats(id: string, ownerId: string) {
    const now = new Date();
    const [teamStats, activeUnavailabilityCount] = await Promise.all([
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
          confirmed: true,
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
      }),
    ]);

    if (!teamStats) {
      throw new NotFoundException("Team doesn't exist");
    }

    return {
      memberCount: teamStats._count.teamMembers,
      incidentCount: teamStats._count.incidents,
      activeUnavailabilityCount,
    };
  }

  async delete(id: string, ownerId: string) {
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
