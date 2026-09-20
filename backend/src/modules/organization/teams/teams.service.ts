import {
  BadRequestException,
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
import { Cursor, cursorSchema } from "./types";
import { convertDateToUtc } from "@/common/utils/timezone";

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

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
