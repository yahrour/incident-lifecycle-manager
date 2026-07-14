import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async add(teamId: string, ownerId: string, userId: string) {
    if (ownerId === userId) {
      throw new ConflictException(
        "SRE Managers are administrative owners and cannot be added to the on-call member rotation."
      );
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.ownerId !== ownerId) {
      throw new NotFoundException("Team doesn't exist");
    }

    try {
      await this.prisma.teamMember.create({
        data: {
          userId,
          teamId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("User is already a member of this team");
        }
        if (error.code === "P2003") {
          throw new NotFoundException("User doesn't exist");
        }

        throw error;
      }
    }
  }

  async findAll(teamId: string, ownerId: string) {
    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        team: {
          ownerId,
        },
      },
    });

    return members;
  }

  async findOne(teamId: string, memberId: number, ownerId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        id: memberId,
        teamId,
        team: {
          ownerId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member doesn't exist");
    }

    return member;
  }

  async removeMember(teamId: string, memberId: number, ownerId: string) {
    try {
      await this.prisma.teamMember.delete({
        where: {
          id: memberId,
          teamId,
          team: {
            ownerId,
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Member doesn't exist");
        }
      }

      throw error;
    }
  }
}
