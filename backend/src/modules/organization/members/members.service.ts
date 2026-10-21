import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OffsetPaginationSearchParams } from "./dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Prisma, UnavailabilityStatus } from "@/generated/prisma/client";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async addToTeam(
    tx: Prisma.TransactionClient,
    teamId: string,
    userId: string
  ) {
    const team = await tx.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    if (team.ownerId === userId) {
      throw new ConflictException(
        "SRE managers can't be added as team members"
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
          throw new ConflictException("This user already belongs to a team");
        }
        if (error.code === "P2003") {
          throw new NotFoundException("User doesn't exist");
        }
      }
      throw error;
    }
  }

  async findByTeam(
    ownerId: string,
    teamId: string,
    query: OffsetPaginationSearchParams
  ) {
    const now = new Date();

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
          orderBy: [
            { [query.sortField]: query.sortOrder },
            { id: query.sortOrder },
          ],
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
              role: true,
            },
          },
          unavailabilities: {
            where: {
              status: UnavailabilityStatus.APPROVED,
              startDate: {
                lte: now,
              },
              endDate: {
                gte: now,
              },
            },
          },
        },
      }),
    ]);

    return { members, total };
  }

  async findAllForOwner(ownerId: string, query: OffsetPaginationSearchParams) {
    const now = new Date();

    const [total, members] = await Promise.all([
      this.prisma.teamMember.count({
        where: {
          team: {
            ownerId,
          },
        },
      }),
      this.prisma.teamMember.findMany({
        take: query.limit,
        skip: query.offset,
        where: {
          team: {
            ownerId,
          },
        },
        ...(query.sortField && {
          orderBy: [
            { [query.sortField]: query.sortOrder },
            { id: query.sortOrder },
          ],
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
              role: true,
            },
          },
          unavailabilities: {
            where: {
              status: UnavailabilityStatus.APPROVED,
              startDate: {
                lte: now,
              },
              endDate: {
                gte: now,
              },
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return { members, total };
  }

  async removeFromTeam(ownerId: string, teamId: string, memberId: number) {
    await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { id: teamId, ownerId },
        select: {
          currentRotationIndex: true,
          teamMembers: { orderBy: { joinedAt: "asc" }, select: { id: true } },
        },
      });

      const position =
        team?.teamMembers.findIndex((member) => member.id === memberId) ?? -1;
      if (!team || position === -1) {
        throw new NotFoundException("Member doesn't exist");
      }

      await tx.teamMember.delete({ where: { id: memberId } });

      if (position < team.currentRotationIndex) {
        await tx.team.update({
          where: { id: teamId },
          data: { currentRotationIndex: { decrement: 1 } },
        });
      }
    });
  }

  async isInTeam(userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        userId,
      },
      select: { id: true },
    });

    return membership !== null;
  }
}
