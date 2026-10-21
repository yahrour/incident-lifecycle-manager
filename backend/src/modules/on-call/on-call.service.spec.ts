/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { createMockPrisma, MockPrisma } from "../../../test/prisma-mock";
import { OnCallService } from "./on-call.service";

const TEAM_ID = "teamId";
const OWNER_ID = "ownerId";
const NOW = new Date("2026-01-15T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * DAY);

const makeUser = (id: string) => ({
  id,
  firstName: id,
  lastName: "Doe",
  email: `${id}@example.com`,
  specialty: null,
  role: "ENGINEER" as const,
});

const makeLeave = (startDate: Date, endDate: Date) => ({
  id: 1,
  memberId: 1,
  startDate,
  endDate,
  reason: null,
  status: "APPROVED" as const,
  createdAt: NOW,
});

const makeMember = (id: string, unavailabilities: unknown[] = []) => ({
  userId: id,
  user: makeUser(id),
  unavailabilities,
});

const makeTeam = (overrides = {}) => ({
  id: TEAM_ID,
  ownerId: OWNER_ID,
  name: "frontend",
  description: null,
  services: ["web"],
  createdAt: new Date("2025-12-01T00:00:00.000Z"),
  updatedAt: NOW,
  lastRotatedAt: daysFromNow(-3),
  currentRotationIndex: 0,
  rotationPeriodDays: 7,
  rotationStartDate: new Date("2025-12-01T00:00:00.000Z"),
  escalationTimeoutMinutes: 30,
  ...overrides,
});

describe("OnCallService", () => {
  let service: OnCallService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [OnCallService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(OnCallService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getCurrentOnCall", () => {
    const mockTeam = (
      members: ReturnType<typeof makeMember>[],
      overrides = {}
    ) =>
      prisma.team.findUnique.mockResolvedValue({
        ...makeTeam(overrides),
        teamMembers: members,
      } as never);

    it("looks the team up scoped to the owner and only loads active approved leave", async () => {
      mockTeam([]);

      await service.getCurrentOnCall(OWNER_ID, TEAM_ID);

      expect(prisma.team.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEAM_ID, ownerId: OWNER_ID },
          include: {
            teamMembers: expect.objectContaining({
              orderBy: { joinedAt: "asc" },
              select: expect.objectContaining({
                unavailabilities: {
                  where: {
                    startDate: { lte: NOW },
                    endDate: { gte: NOW },
                    status: "APPROVED",
                  },
                },
              }),
            }),
          },
        })
      );
    });

    it("throws NotFoundException when the team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentOnCall(OWNER_ID, TEAM_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("returns null when the team has no members", async () => {
      mockTeam([]);

      await expect(
        service.getCurrentOnCall(OWNER_ID, TEAM_ID)
      ).resolves.toBeNull();
    });

    it("returns the primary and the next member as secondary", async () => {
      mockTeam([makeMember("a"), makeMember("b"), makeMember("c")]);

      const result = await service.getCurrentOnCall(OWNER_ID, TEAM_ID);

      expect(result).toEqual({
        teamId: TEAM_ID,
        escalationTimeoutMinutes: 30,
        chain: [
          { ...makeUser("a"), position: "PRIMARY" },
          { ...makeUser("b"), position: "SECONDARY" },
        ],
      });
    });

    it("starts the chain at currentRotationIndex and wraps around", async () => {
      mockTeam([makeMember("a"), makeMember("b"), makeMember("c")], {
        currentRotationIndex: 2,
      });

      const result = await service.getCurrentOnCall(OWNER_ID, TEAM_ID);

      expect(result?.chain.map((m) => [m.id, m.position])).toEqual([
        ["c", "PRIMARY"],
        ["a", "SECONDARY"],
      ]);
    });

    it("uses the primary as secondary when they're the only member", async () => {
      mockTeam([makeMember("a")]);

      const result = await service.getCurrentOnCall(OWNER_ID, TEAM_ID);

      expect(result?.chain.map((m) => [m.id, m.position])).toEqual([
        ["a", "PRIMARY"],
        ["a", "SECONDARY"],
      ]);
    });

    it("skips members on approved leave", async () => {
      const leave = [makeLeave(daysFromNow(-1), daysFromNow(1))];
      mockTeam([makeMember("a", leave), makeMember("b"), makeMember("c")]);

      const result = await service.getCurrentOnCall(OWNER_ID, TEAM_ID);

      expect(result?.chain.map((m) => m.id)).toEqual(["b", "c"]);
    });

    it("uses the primary as secondary when everyone else is unavailable", async () => {
      const leave = [makeLeave(daysFromNow(-1), daysFromNow(1))];
      mockTeam([
        makeMember("a"),
        makeMember("b", leave),
        makeMember("c", leave),
      ]);

      const result = await service.getCurrentOnCall(OWNER_ID, TEAM_ID);

      expect(result?.chain.map((m) => [m.id, m.position])).toEqual([
        ["a", "PRIMARY"],
        ["a", "SECONDARY"],
      ]);
    });

    it("returns an empty chain when every member is unavailable", async () => {
      const leave = [makeLeave(daysFromNow(-1), daysFromNow(1))];
      mockTeam([makeMember("a", leave), makeMember("b", leave)]);

      await expect(
        service.getCurrentOnCall(OWNER_ID, TEAM_ID)
      ).resolves.toEqual({
        teamId: TEAM_ID,
        escalationTimeoutMinutes: 30,
        chain: [],
      });
    });
  });

  describe("getUserOnCallStatus", () => {
    const mockTeam = (
      members: ReturnType<typeof makeMember>[],
      overrides = {}
    ) => {
      prisma.team.findUnique.mockResolvedValue({
        ...makeTeam(overrides),
        teamMembers: members,
      } as never);
      prisma.incident.count
        .mockResolvedValueOnce(4) // assigned and not resolved
        .mockResolvedValueOnce(1); // unacknowledged
    };

    const team = {
      id: TEAM_ID,
      name: "frontend",
      escalationTimeoutMinutes: 30,
    };
    const incidents = {
      totalAssignedIncidents: 4,
      totalUnacknowledgedIncidents: 1,
    };

    it("throws NotFoundException when the team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      prisma.incident.count.mockResolvedValue(0);

      await expect(service.getUserOnCallStatus(TEAM_ID, "a")).rejects.toThrow(
        NotFoundException
      );
    });

    it("reports the primary as on call for the current period", async () => {
      mockTeam([makeMember("a"), makeMember("b")]);

      const result = await service.getUserOnCallStatus(TEAM_ID, "a");

      expect(result).toEqual({
        isOnCall: true,
        currentShift: {
          team,
          position: "PRIMARY",
          startsAt: daysFromNow(-3),
          endsAt: daysFromNow(4),
          incidents,
        },
      });
    });

    it("reports the secondary as not on call, with next period's window", async () => {
      mockTeam([makeMember("a"), makeMember("b")]);

      const result = await service.getUserOnCallStatus(TEAM_ID, "b");

      expect(result).toEqual({
        isOnCall: false,
        currentShift: {
          team,
          position: "SECONDARY",
          startsAt: daysFromNow(4),
          endsAt: daysFromNow(11),
          incidents,
        },
      });
    });

    it("anchors the window on rotationStartDate when it's later than lastRotatedAt", async () => {
      mockTeam([makeMember("a"), makeMember("b")], {
        rotationStartDate: daysFromNow(-1),
      });

      const result = await service.getUserOnCallStatus(TEAM_ID, "a");

      expect(result.currentShift?.startsAt).toEqual(daysFromNow(-1));
      expect(result.currentShift?.endsAt).toEqual(daysFromNow(6));
    });

    it("promotes the next available member when the primary is on leave", async () => {
      const leave = [makeLeave(daysFromNow(-1), daysFromNow(1))];
      mockTeam([makeMember("a", leave), makeMember("b"), makeMember("c")]);

      const b = await service.getUserOnCallStatus(TEAM_ID, "b");

      expect(b.isOnCall).toBe(true);
    });

    it("returns no shift for a user outside the primary/secondary chain", async () => {
      mockTeam([makeMember("a"), makeMember("b"), makeMember("c")]);

      await expect(service.getUserOnCallStatus(TEAM_ID, "c")).resolves.toEqual({
        isOnCall: false,
        currentShift: null,
      });
    });

    it("counts the user's unresolved and unacknowledged incidents", async () => {
      mockTeam([makeMember("a")]);

      await service.getUserOnCallStatus(TEAM_ID, "a");

      expect(prisma.incident.count).toHaveBeenNthCalledWith(1, {
        where: { assignedToId: "a", status: { not: "resolved" } },
      });
      expect(prisma.incident.count).toHaveBeenNthCalledWith(2, {
        where: { assignedToId: "a", acknowledgedAt: null },
      });
    });
  });

  describe("getUpcomingRotations", () => {
    const mockTeam = (
      members: ReturnType<typeof makeMember>[],
      overrides = {}
    ) =>
      prisma.team.findUnique.mockResolvedValue({
        ...makeTeam(overrides),
        teamMembers: members,
      } as never);

    it("lets the owner in", async () => {
      mockTeam([makeMember("a"), makeMember("b")]);

      await expect(
        service.getUpcomingRotations(OWNER_ID, TEAM_ID)
      ).resolves.toHaveLength(1);
      expect(prisma.team.findUnique).toHaveBeenCalledTimes(1);
    });

    it("lets a member of the team in", async () => {
      mockTeam([makeMember("a"), makeMember("b")]);

      await expect(
        service.getUpcomingRotations("a", TEAM_ID)
      ).resolves.toHaveLength(1);
    });

    it("exposes id, email and role of members to the owner", async () => {
      mockTeam([makeMember("a"), makeMember("b")]);

      const result = await service.getUpcomingRotations(OWNER_ID, TEAM_ID);

      expect(result?.[0].user).toEqual(makeUser("b"));
    });

    it("hides id, email and role of members from a teammate", async () => {
      mockTeam([makeMember("a"), makeMember("b")]);

      const result = await service.getUpcomingRotations("a", TEAM_ID);

      expect(result?.[0].user).toEqual({
        firstName: "b",
        lastName: "Doe",
        specialty: null,
      });
      expect(result?.[0].user).not.toHaveProperty("email");
    });

    it("throws NotFoundException when the requester is neither owner nor member", async () => {
      mockTeam([makeMember("a")]);

      await expect(
        service.getUpcomingRotations("stranger", TEAM_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when the team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(
        service.getUpcomingRotations(OWNER_ID, TEAM_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it("returns null when the team has no members", async () => {
      mockTeam([]);

      await expect(
        service.getUpcomingRotations(OWNER_ID, TEAM_ID)
      ).resolves.toBeNull();
    });

    it("returns an empty list when the only member is the current on-call", async () => {
      mockTeam([makeMember("a")]);

      await expect(
        service.getUpcomingRotations(OWNER_ID, TEAM_ID)
      ).resolves.toEqual([]);
    });

    it("lists the following members with consecutive rotation windows, skipping the current one", async () => {
      mockTeam([makeMember("a"), makeMember("b"), makeMember("c")]);

      const result = await service.getUpcomingRotations(OWNER_ID, TEAM_ID);

      expect(result).toEqual([
        {
          user: makeUser("b"),
          shift: { startDate: daysFromNow(4), endDate: daysFromNow(11) },
        },
        {
          user: makeUser("c"),
          shift: { startDate: daysFromNow(11), endDate: daysFromNow(18) },
        },
      ]);
    });

    it("starts after currentRotationIndex and wraps around", async () => {
      mockTeam([makeMember("a"), makeMember("b"), makeMember("c")], {
        currentRotationIndex: 2,
      });

      const result = await service.getUpcomingRotations(OWNER_ID, TEAM_ID);

      expect(result?.map((r) => r.user.id)).toEqual(["a", "b"]);
    });

    it("skips a member whose approved leave overlaps their slot", async () => {
      // b's slot is days 4–11; leave on day 5 overlaps it
      const leave = [makeLeave(daysFromNow(5), daysFromNow(6))];
      mockTeam([makeMember("a"), makeMember("b", leave), makeMember("c")]);

      const result = await service.getUpcomingRotations(OWNER_ID, TEAM_ID);

      expect(result?.map((r) => r.user.id)).toEqual(["c"]);
    });

    it("keeps a member whose leave is outside their slot", async () => {
      const leave = [makeLeave(daysFromNow(12), daysFromNow(14))];
      mockTeam([makeMember("a"), makeMember("b", leave)]);

      const result = await service.getUpcomingRotations(OWNER_ID, TEAM_ID);

      expect(result?.map((r) => r.user.id)).toEqual(["b"]);
    });

    it("returns at most 5 rotations", async () => {
      mockTeam(Array.from({ length: 10 }, (_, i) => makeMember(`user-${i}`)));

      const result = await service.getUpcomingRotations(OWNER_ID, TEAM_ID);

      expect(result).toHaveLength(5);
    });
  });

  describe("processRotations", () => {
    const makeRotationTeam = (overrides = {}, memberCount = 3) => ({
      id: TEAM_ID,
      name: "frontend",
      lastRotatedAt: daysFromNow(-14),
      currentRotationIndex: 0,
      rotationPeriodDays: 7,
      rotationStartDate: daysFromNow(-60),
      _count: { teamMembers: memberCount },
      teamMembers: Array.from({ length: memberCount }, (_, i) => ({
        userId: `user-${i}`,
      })),
      ...overrides,
    });

    it("does nothing when there are no teams", async () => {
      prisma.team.findMany.mockResolvedValue([]);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("skips a team whose rotation hasn't started yet", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({ rotationStartDate: daysFromNow(1) }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("skips a team with no members", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({}, 0),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("doesn't rotate before the period has elapsed", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({ lastRotatedAt: daysFromNow(-6) }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("rotates exactly when the period has elapsed", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({ lastRotatedAt: daysFromNow(-7) }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledTimes(1);
    });

    it("advances the index and guards on lastRotatedAt to avoid double rotation", async () => {
      const lastRotatedAt = daysFromNow(-14);
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({ lastRotatedAt, currentRotationIndex: 1 }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledWith({
        where: { id: TEAM_ID, lastRotatedAt, currentRotationIndex: 1 },
        // the scheduled handover (lastRotatedAt + 7d), not the cron's run time
        data: { lastRotatedAt: daysFromNow(-7), currentRotationIndex: 2 },
      });
    });

    it("wraps the index back to 0 after the last member", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({ currentRotationIndex: 2 }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentRotationIndex: 0 }),
        })
      );
    });

    it("measures the period from rotationStartDate when it's later than lastRotatedAt", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({
          lastRotatedAt: daysFromNow(-30),
          rotationStartDate: daysFromNow(-2),
        }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("processes each team independently", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeRotationTeam({ id: "due" }),
        makeRotationTeam({ id: "not-due", lastRotatedAt: daysFromNow(-1) }),
        makeRotationTeam({ id: "empty" }, 0),
        makeRotationTeam({ id: "also-due", currentRotationIndex: 1 }),
      ] as never);

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.team.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "due" }),
        })
      );
      expect(prisma.team.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "also-due" }),
        })
      );
    });
  });
});
