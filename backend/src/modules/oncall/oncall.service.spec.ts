import { Test } from "@nestjs/testing";
import { PrismaService } from "@/common/prisma/prisma.service";
import { createMockPrisma, MockPrisma } from "../../../test/prisma-mock";
import { OnCallService } from "./oncall.service";
import { DiscordService } from "@/modules/discord/discord.service";
import { NotFoundException } from "@nestjs/common";
import { mock } from "jest-mock-extended";

const TEAM_ID = "teamId";
const OWNER_ID = "ownerId";

function makeTeam(overrides = {}) {
  return {
    id: "team1",
    createdAt: new Date("2025-12-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    name: "frontend",
    ownerId: OWNER_ID,
    description: null,
    lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"),
    currentRotationIndex: 0,
    lastNotifiedRotationIndex: 0,
    rotationPeriodDays: 7,
    rotationStartDate: new Date("2025-12-01T00:00:00.000Z"),
    escalationTimeoutMinutes: 30,
    webhookUrl: null,
    _count: { teamMembers: 3 },
    teamMembers: [
      { userId: "user-1" },
      { userId: "user-2" },
      { userId: "user-3" },
    ],
    ...overrides,
  };
}

describe("OnCallService", () => {
  let service: OnCallService;
  let prisma: MockPrisma;
  let discordService: DiscordService;

  beforeEach(async () => {
    prisma = createMockPrisma();
    discordService = mock<DiscordService>();
    const module = await Test.createTestingModule({
      providers: [
        OnCallService,
        { provide: PrismaService, useValue: prisma },
        { provide: DiscordService, useValue: discordService },
      ],
    }).compile();

    service = module.get(OnCallService);

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("getCurrentOnCall", () => {
    it("should throw NotFoundException when team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentOnCall(TEAM_ID, OWNER_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should return null when team doesn't have any members", async () => {
      const team = {
        id: "team-1",
        ownerId: "user-1",
        name: "frontend",
        description: null,
        createdAt: new Date(),
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastNotifiedRotationIndex: 0,
        lastRotatedAt: new Date("2026-08-03T00:00:00Z"),
        escalationTimeoutMinutes: 30,
        webhookUrl: null,
        updatedAt: new Date("2026-08-08T14:30:00Z"),
        teamMembers: [],
      };

      prisma.team.findUnique.mockResolvedValue(team);

      const result = await service.getCurrentOnCall(TEAM_ID, OWNER_ID);

      expect(result).toBeNull();
    });

    it("should return empty OnCall chain", async () => {
      const team = {
        id: "team-1",
        ownerId: "user-1",
        name: "frontend",
        description: null,
        createdAt: new Date(),
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastNotifiedRotationIndex: 0,
        lastRotatedAt: new Date("2026-08-03T00:00:00Z"),
        escalationTimeoutMinutes: 30,
        webhookUrl: null,
        updatedAt: new Date("2026-08-08T14:30:00Z"),

        teamMembers: [
          {
            user: {
              id: "user-001",
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              specialty: "Backend",
            },
            unavailabilities: [
              {
                id: 1,
                createdAt: new Date("2026-07-20T10:00:00Z"),
                confirmed: true,
                memberId: 1,
                startDate: new Date("2026-08-10T00:00:00Z"),
                endDate: new Date("2026-08-12T23:59:59Z"),
                reason: "Vacation",
              },
            ],
          },
        ],
      };

      prisma.team.findUnique.mockResolvedValue(team);

      const result = await service.getCurrentOnCall(TEAM_ID, OWNER_ID);

      expect(result).not.toBeNull();
      expect(result?.chain).not.toBeNull();
      expect(result?.chain).toHaveLength(0);
    });

    it("should return OnCall chain with primary engineer is also the secondary on-call", async () => {
      const team = {
        id: "team-1",
        ownerId: "user-1",
        name: "frontend",
        description: null,
        createdAt: new Date(),

        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastNotifiedRotationIndex: 0,
        lastRotatedAt: new Date("2026-08-03T00:00:00Z"),

        escalationTimeoutMinutes: 30,
        webhookUrl: null,
        updatedAt: new Date("2026-08-08T14:30:00Z"),

        teamMembers: [
          {
            user: {
              id: "user-001",
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              specialty: "Backend",
            },
            unavailabilities: [],
          },
        ],
      };

      prisma.team.findUnique.mockResolvedValue(team);

      const result = await service.getCurrentOnCall(TEAM_ID, OWNER_ID);

      expect(result).not.toBeNull();
      expect(result?.chain).not.toBeNull();
      expect(result?.chain).toHaveLength(2);
      // @ts-expect-error ignore
      // eslint-disable-next-line
      const { role: primaryRole, ...primary } = result?.chain[0];
      // @ts-expect-error ignore
      // eslint-disable-next-line
      const { role: secondaryRole, ...secondary } = result?.chain[1];
      expect(primary).toEqual(secondary);
    });

    it("should return OnCall engineers chain", async () => {
      const team = {
        id: "team-1",
        ownerId: "user-1",
        name: "frontend",
        description: null,
        createdAt: new Date(),
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastNotifiedRotationIndex: 0,
        lastRotatedAt: new Date("2026-08-03T00:00:00Z"),
        escalationTimeoutMinutes: 30,
        webhookUrl: null,
        updatedAt: new Date("2026-08-08T14:30:00Z"),

        teamMembers: [
          {
            user: {
              id: "user-2",
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              specialty: "Backend",
            },
            unavailabilities: [],
          },

          {
            user: {
              id: "user-3",
              firstName: "Alex",
              lastName: "Johnson",
              email: "alex.johnson@example.com",
              specialty: "DevOps",
            },
            unavailabilities: [],
          },
        ],
      };

      prisma.team.findUnique.mockResolvedValue(team);

      const result = await service.getCurrentOnCall(TEAM_ID, OWNER_ID);

      expect(result).not.toBeNull();
      expect(result?.chain).not.toBeNull();
      expect(result?.chain).toHaveLength(2);
      expect(result?.chain[0]).toEqual({
        role: "PRIMARY",
        ...team.teamMembers[0].user,
      });
      expect(result?.chain[1]).toEqual({
        role: "SECONDARY",
        ...team.teamMembers[1].user,
      });
    });

    it("should skip unavailable members when determining on-call rotation", async () => {
      const team = {
        id: "team-1",
        ownerId: "user-1",
        name: "frontend",
        description: null,
        createdAt: new Date(),

        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastNotifiedRotationIndex: 0,
        lastRotatedAt: new Date("2026-08-03T00:00:00Z"),

        escalationTimeoutMinutes: 30,
        webhookUrl: null,
        updatedAt: new Date("2026-08-08T14:30:00Z"),

        teamMembers: [
          {
            user: {
              id: "user-001",
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              specialty: "Backend",
            },
            unavailabilities: [
              {
                id: 1,
                createdAt: new Date("2026-07-20T10:00:00Z"),
                confirmed: true,
                memberId: 1,
                startDate: new Date("2026-08-10T00:00:00Z"),
                endDate: new Date("2026-08-12T23:59:59Z"),
                reason: "Vacation",
              },
            ],
          },
          {
            user: {
              id: "user-002",
              firstName: "Jane",
              lastName: "Smith",
              email: "jane.smith@example.com",
              specialty: "Frontend",
            },
            unavailabilities: [],
          },
          {
            user: {
              id: "user-003",
              firstName: "Alex",
              lastName: "Johnson",
              email: "alex.johnson@example.com",
              specialty: "DevOps",
            },
            unavailabilities: [],
          },
        ],
      };

      prisma.team.findUnique.mockResolvedValue(team);

      const result = await service.getCurrentOnCall(TEAM_ID, OWNER_ID);

      expect(result).not.toBeNull();
      expect(result?.chain).not.toBeNull();
      expect(result?.chain).toHaveLength(2);
      expect(result?.chain[0]).toEqual({
        role: "PRIMARY",
        ...team.teamMembers[1].user,
      });
      expect(result?.chain[1]).toEqual({
        role: "SECONDARY",
        ...team.teamMembers[2].user,
      });
    });
  });

  describe("processRotations", () => {
    it("does nothing when there are no teams", async () => {
      prisma.team.findMany.mockResolvedValue([]);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("skips a team whose rotationStartDate is in the future", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          rotationStartDate: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ]);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("does not rotate when not enough days have passed", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastRotatedAt: new Date("2026-01-14T00:00:00.000Z"), // 1 day ago, period is 7
        }),
      ]);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("skips rotation when team has 0 members", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"), // 14 days ago
          _count: { teamMembers: 0 },
        }),
      ]);

      await service.processRotations();

      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("rotates when enough days have passed and members exist", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"), // 14 days ago
          currentRotationIndex: 1,
          rotationPeriodDays: 7,
          _count: { teamMembers: 3 },
        }),
      ]);
      prisma.team.updateMany.mockResolvedValue({ count: 1 });

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledWith({
        where: {
          id: "team1",
          lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        data: {
          lastRotatedAt: new Date("2026-01-15T00:00:00.000Z"), // fixed "now"
          currentRotationIndex: 2, // (1 + 1) % 3
          lastNotifiedRotationIndex: 2,
        },
      });
    });

    it("wraps currentRotationIndex via modulo at the end of the cycle", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"),
          currentRotationIndex: 2, // last index of 3 members (0,1,2)
          _count: { teamMembers: 3 },
        }),
      ]);
      prisma.team.updateMany.mockResolvedValue({ count: 1 });

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line
          data: expect.objectContaining({ currentRotationIndex: 0 }), // (2+1) % 3
        })
      );
    });

    it("notifies the current on-call engineer when a team is created (no rotation yet)", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastNotifiedRotationIndex: -1, // never notified
          currentRotationIndex: 0,
          lastRotatedAt: new Date("2026-01-14T00:00:00.000Z"), // not due
          webhookUrl: "https://discord.com/api/webhooks/abc",
        }),
      ]);
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        discordId: "123456789",
        discordName: null,
        email: "user-1@example.com",
        firstName: "John",
        lastName: "Doe",
        passwordHash: null,
        role: "ENGINEER",
        googleId: null,
        specialty: null,
        timezone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.processRotations();

      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: "team1" },
        data: { lastNotifiedRotationIndex: 0 },
      });
      expect(discordService.sendWebhookNotification).toHaveBeenCalledWith(
        "https://discord.com/api/webhooks/abc",
        expect.objectContaining({
          content: expect.stringContaining("<@123456789>") as string,
        })
      );
    });

    it("does not re-notify the current on-call engineer if already notified", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastNotifiedRotationIndex: 0,
          currentRotationIndex: 0,
          lastRotatedAt: new Date("2026-01-14T00:00:00.000Z"), // not due
          webhookUrl: "https://discord.com/hooks/abc",
        }),
      ]);

      await service.processRotations();

      expect(prisma.team.update).not.toHaveBeenCalled();
      expect(discordService.sendWebhookNotification).not.toHaveBeenCalled();
    });

    it("notifies only the incoming engineer when a rotation happens", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"), // due
          currentRotationIndex: 1,
          rotationPeriodDays: 7,
          _count: { teamMembers: 3 },
          webhookUrl: "https://discord.com/hooks/abc",
        }),
      ]);
      prisma.team.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        discordId: "111",
        discordName: null,
        email: "user-1@example.com",
        firstName: "John",
        lastName: "Doe",
        passwordHash: null,
        role: "ENGINEER",
        googleId: null,
        specialty: null,
        timezone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.processRotations();

      // only the incoming engineer (index 2) is notified, not the outgoing one
      expect(discordService.sendWebhookNotification).toHaveBeenCalledTimes(1);
    });

    it("uses rotationStartDate as baseTime when it is later than lastRotatedAt", async () => {
      // lastRotatedAt is old, but rotationStartDate is more recent and only 1 day before "now"
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          lastRotatedAt: new Date("2025-01-01T00:00:00.000Z"), // very old
          rotationStartDate: new Date("2026-01-14T00:00:00.000Z"), // 1 day before "now"
          rotationPeriodDays: 7,
        }),
      ]);

      await service.processRotations();

      // Should NOT rotate — baseTime should be rotationStartDate (1 day ago), not lastRotatedAt
      expect(prisma.team.updateMany).not.toHaveBeenCalled();
    });

    it("processes multiple teams independently", async () => {
      prisma.team.findMany.mockResolvedValue([
        makeTeam({
          id: "team1",
          lastRotatedAt: new Date("2026-01-01T00:00:00.000Z"), // due
        }),
        makeTeam({
          id: "team2",
          lastRotatedAt: new Date("2026-01-14T00:00:00.000Z"), // not due
        }),
      ]);
      prisma.team.updateMany.mockResolvedValue({ count: 1 });

      await service.processRotations();

      expect(prisma.team.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.team.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line
          where: expect.objectContaining({ id: "team1" }),
        })
      );
    });
  });
});
