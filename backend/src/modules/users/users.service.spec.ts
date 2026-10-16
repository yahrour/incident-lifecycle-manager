/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";
import { OnCallService } from "../on-call/on-call.service";
import { UnavailabilityService } from "../organization/unavailability/unavailability.service";
import { createMockPrisma, MockPrisma } from "../../../test/prisma-mock";

const USER_ID = "userId";
const TEAM_ID = "teamId";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: MockPrisma;
  const onCall = { getUpcomingRotations: jest.fn() };
  const unavailability = { findTeammatesAway: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma = createMockPrisma();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: BcryptService, useValue: { hash: jest.fn() } },
        { provide: OnCallService, useValue: onCall },
        { provide: UnavailabilityService, useValue: unavailability },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe("getMyTeam", () => {
    const mockMembership = () =>
      prisma.teamMember.findUnique.mockResolvedValue({
        id: 1,
        team: { id: TEAM_ID, name: "frontend" },
      } as never);

    const teamRow = {
      id: TEAM_ID,
      name: "frontend",
      description: null,
      services: ["web"],
      rotationPeriodDays: 7,
      escalationTimeoutMinutes: 30,
      _count: { teamMembers: 8 },
      teamMembers: [
        {
          id: 7,
          joinedAt: new Date("2026-01-10T00:00:00.000Z"),
          user: { firstName: "A", lastName: "B", specialty: null },
        },
      ],
    };

    it("returns null when the user has no team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.getMyTeam(USER_ID)).resolves.toBeNull();
      expect(prisma.team.findUnique).not.toHaveBeenCalled();
      expect(onCall.getUpcomingRotations).not.toHaveBeenCalled();
      expect(unavailability.findTeammatesAway).not.toHaveBeenCalled();
    });

    it("returns null when the team can't be loaded", async () => {
      mockMembership();
      prisma.team.findUnique.mockResolvedValue(null);
      onCall.getUpcomingRotations.mockResolvedValue([]);
      unavailability.findTeammatesAway.mockResolvedValue([]);

      await expect(service.getMyTeam(USER_ID)).resolves.toBeNull();
    });

    it("combines team info, latest members, member count, rotations and away teammates", async () => {
      const rotations = [
        {
          firstName: "C",
          lastName: "E",
          specialty: "SRE",
          startDate: new Date("2026-01-20T00:00:00.000Z"),
          endDate: new Date("2026-01-27T00:00:00.000Z"),
        },
      ];
      const away = [{ user: { firstName: "D" }, unavailabilities: [] }];
      mockMembership();
      prisma.team.findUnique.mockResolvedValue(teamRow as never);
      onCall.getUpcomingRotations.mockResolvedValue(rotations);
      unavailability.findTeammatesAway.mockResolvedValue(away);

      const result = await service.getMyTeam(USER_ID);

      expect(result).toEqual({
        team: {
          id: TEAM_ID,
          name: "frontend",
          description: null,
          services: ["web"],
          rotationPeriodDays: 7,
          escalationTimeoutMinutes: 30,
        },
        members: teamRow.teamMembers,
        membersCount: 8,
        teamUpcomingRotations: rotations,
        teammatesAway: away,
      });
      expect(onCall.getUpcomingRotations).toHaveBeenCalledWith(
        USER_ID,
        TEAM_ID
      );
      expect(unavailability.findTeammatesAway).toHaveBeenCalledWith(
        USER_ID,
        TEAM_ID
      );
    });

    it("loads only the 5 most recently joined members, with no email or role", async () => {
      mockMembership();
      prisma.team.findUnique.mockResolvedValue(teamRow as never);
      onCall.getUpcomingRotations.mockResolvedValue([]);
      unavailability.findTeammatesAway.mockResolvedValue([]);

      await service.getMyTeam(USER_ID);

      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID },
        select: expect.objectContaining({
          teamMembers: {
            take: 5,
            orderBy: { joinedAt: "desc" },
            select: {
              id: true,
              joinedAt: true,
              user: {
                select: { firstName: true, lastName: true, specialty: true },
              },
            },
          },
        }),
      });
    });

    it("doesn't expose the owner id", async () => {
      mockMembership();
      prisma.team.findUnique.mockResolvedValue(teamRow as never);
      onCall.getUpcomingRotations.mockResolvedValue([]);
      unavailability.findTeammatesAway.mockResolvedValue([]);

      const result = await service.getMyTeam(USER_ID);

      expect(result?.team).not.toHaveProperty("ownerId");
      expect(result?.team).not.toHaveProperty("_count");
    });
  });
});
