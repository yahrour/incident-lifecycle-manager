import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OnCallService {
  constructor(private prisma: PrismaService) {}

  async getCurrentOnCall(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, owner_id: ownerId },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        team_id: teamId,
      },
      orderBy: {
        joined_at: "asc",
      },
      include: { unavailabilities: true },
    });

    if (members.length === 0) {
      return null;
    }

    const now = Date.now();
    const rotationPeriodMs = team.rotation_period_days * 24 * 60 * 60 * 1000; // convert the rotation period to Ms
    const elapsed = now - team.last_rotated_at.getTime(); // get the duration of when last time rotated till now
    const periodsElapsed = Math.floor(elapsed / rotationPeriodMs); // get how many full rotations periods have passed

    let baseIndex = team.current_rotation_index;

    if (periodsElapsed > 0) {
      baseIndex =
        (team.current_rotation_index + periodsElapsed) % members.length;
      const newLastRotated = new Date(
        team.last_rotated_at.getTime() + periodsElapsed * rotationPeriodMs
      );

      await this.prisma.team.update({
        where: { id: teamId },
        data: {
          current_rotation_index: baseIndex,
          last_rotated_at: newLastRotated,
        },
      });
    }

    // loop over the team members starting from the current on-call member till finding the first available one
    for (let offset = 0; offset < members.length; offset++) {
      const condidate = members[(baseIndex + offset) % members.length];
      const isUnavailable = condidate.unavailabilities.some((dateOverride) => {
        now >= dateOverride.start_date.getTime() &&
          now <= dateOverride.end_date.getTime();
      });
      if (!isUnavailable) {
        return condidate;
      }
    }

    return null;
  }
}
