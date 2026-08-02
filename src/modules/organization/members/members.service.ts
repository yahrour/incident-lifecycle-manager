import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OffsetPaginationSearchParams } from "./dto";
import { PrismaService } from "src/common/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { PrismaClientKnownRequestError } from "src/generated/prisma/internal/prismaNamespace";

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async add(tx: Prisma.TransactionClient, teamId: string, userId: string) {
    const team = await tx.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    if (team.ownerId === userId) {
      throw new ConflictException(
        "SRE Managers are administrative owners and cannot be added to the on-call member rotation."
      );
    }

    try {
      await tx.teamMember.create({
        data: {
          userId,
          teamId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(
            "This user is already a member of a team"
          );
        }
        if (error.code === "P2003") {
          throw new NotFoundException("User doesn't exist");
        }
      }
      throw error;
    }
  }

  async findAll(
    teamId: string,
    ownerId: string,
    query: OffsetPaginationSearchParams
  ) {
    const [total, members] = await Promise.all([
      this.prisma.teamMember.count({
        where: {
          teamId,
          team: {
            ownerId,
          },
        },
      }),
      this.prisma.teamMember.findMany({
        take: query.limit,
        skip: query.offset,
        where: {
          teamId,
          team: {
            ownerId,
          },
        },
        ...(query.sortField && {
          orderBy: {
            [query.sortField]: query.sortOrder,
          },
        }),
        omit: {
          userId: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              specialty: true,
            },
          },
        },
      }),
    ]);

    return { members, total };
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
      omit: {
        userId: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialty: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member doesn't exist");
    }

    return member;
  }

  async remove(teamId: string, memberId: number, ownerId: string) {
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
