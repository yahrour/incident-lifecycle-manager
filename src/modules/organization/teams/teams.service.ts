import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";
import {
  CreateTeamDto,
  CursorPaginationSearchParams,
  UpdateTeamDto,
} from "./dto";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/common/prisma/prisma.service";
import { Cursor, cursorSchema } from "./types";

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
          rotationStartDate: createTeamDto.rotationStartDate,
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
          throw new ConflictException("Team already exist");
        }
      }

      throw error;
    }
  }

  async update(id: string, ownerId: string, updateTeamDto: UpdateTeamDto) {
    const data: Prisma.TeamUpdateInput = { ...updateTeamDto };

    if (
      updateTeamDto.rotationPeriodDays !== undefined ||
      updateTeamDto.rotationStartDate !== undefined
    ) {
      data.currentRotationIndex = 0;
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

  async findAll(ownerId: string, query: CursorPaginationSearchParams) {
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

    const teams = await this.prisma.team.findMany({
      where: {
        ownerId,
        ...(query.search && {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        }),
      },
      take: query.limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor.id,
        },
      }),
      orderBy: [
        { [query.sortField]: query.sortOrder },
        { id: query.sortOrder },
      ],
      omit: {
        ownerId: true,
        updatedAt: true,
      },
    });

    const hasNextPage = teams.length > query.limit;
    const data = hasNextPage ? teams.slice(0, query.limit) : teams;
    const nextCursor = hasNextPage
      ? this.encodeCursor({
          id: data[data.length - 1].id,
          sortField: query.sortField,
          sortOrder: query.sortOrder,
        })
      : null;

    return { data, nextCursor };
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
