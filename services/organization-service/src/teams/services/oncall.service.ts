import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OnCallService {
  constructor(private prisma: PrismaService) {}

  async getCurrentOnCall(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, ownerId },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
      },
      orderBy: {
        joinedAt: "asc",
      },
      include: { unavailabilities: true },
    });

    if (members.length === 0) {
      return null;
    }

    const now = Date.now();
    const rotationPeriodMs = team.rotationPeriodDays * 24 * 60 * 60 * 1000; // convert the rotation period to Ms
    const elapsed = now - team.lastRotatedAt.getTime(); // get the duration of when last time rotated till now
    const periodsElapsed = Math.floor(elapsed / rotationPeriodMs); // get how many full rotations periods have passed

    let baseIndex = team.currentRotationIndex;

    if (periodsElapsed > 0) {
      baseIndex = (team.currentRotationIndex + periodsElapsed) % members.length;
      const newLastRotated = new Date(
        team.lastRotatedAt.getTime() + periodsElapsed * rotationPeriodMs
      );

      await this.prisma.team.update({
        where: { id: teamId },
        data: {
          currentRotationIndex: baseIndex,
          lastRotatedAt: newLastRotated,
        },
      });
    }

    // loop over the team members starting from the current on-call member till finding the first available one
    for (let offset = 0; offset < members.length; offset++) {
      const candidate = members[(baseIndex + offset) % members.length];
      const isUnAvailable = candidate.unavailabilities.some(
        (unavailability) => {
          return (
            now >= unavailability.startDate.getTime() &&
            now <= unavailability.endDate.getTime()
          );
        }
      );
      if (!isUnAvailable) {
        return {
          id: candidate.id,
          userId: candidate.userId,
          teamId: candidate.teamId,
          joinedAt: candidate.joinedAt,
        };
      }
    }

    return null;
  }
}
