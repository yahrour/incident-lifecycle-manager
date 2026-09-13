import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";
import { CreateTeamDto, UpdateTeamDto } from "./dto";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/common/prisma/prisma.service";

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

  async findAll(ownerId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        ownerId,
      },
      omit: {
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return teams;
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

  async remove(id: string, ownerId: string) {
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
