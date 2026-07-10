import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";
import { CreateTeamDto, UpdateTeamDto } from "../dto";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createTeamDto: CreateTeamDto) {
    try {
      const team = await this.prisma.team.create({
        data: {
          owner_id: ownerId,
          name: createTeamDto.name,
          description: createTeamDto.description,
          rotation_period_days: createTeamDto.rotation_period_days,
          rotation_start_date: createTeamDto.rotation_start_date,
          escalation_timeout_minutes: createTeamDto.escalation_timeout_minutes,
        },
        omit: {
          owner_id: true,
          created_at: true,
          updated_at: true,
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
        owner_id: ownerId,
      },
      omit: {
        owner_id: true,
        created_at: true,
        updated_at: true,
      },
    });
    return teams;
  }

  async findOne(id: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: {
        id,
        owner_id: ownerId,
      },
      omit: {
        owner_id: true,
        created_at: true,
        updated_at: true,
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
      updateTeamDto.rotation_period_days !== undefined ||
      updateTeamDto.rotation_start_date !== undefined
    ) {
      data.current_rotation_index = 0;
      data.last_rotated_at = new Date();
    }

    try {
      const updatedTeam = await this.prisma.team.update({
        where: {
          id,
          owner_id: ownerId,
        },
        data,
        omit: {
          owner_id: true,
          created_at: true,
          updated_at: true,
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
          owner_id: ownerId,
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
