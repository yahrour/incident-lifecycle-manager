/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { convertDateToUtc } from "@/common/utils/timezone";
import { SORT_ORDER } from "@/common/constants";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { TeamsService } from "./teams.service";
import { SORT_FIELD } from "./constants";

const TEAM_ID = "teamId";
const OWNER_ID = "ownerId";
const NOW = new Date("2026-01-15T12:00:00.000Z");

const prismaError = (code: string) =>
  new PrismaClientKnownRequestError(code, { code, clientVersion: "5.0.0" });

const makeTeam = (overrides = {}) => ({
  id: TEAM_ID,
  ownerId: OWNER_ID,
  name: "frontend",
  description: null,
  services: ["web"],
  rotationPeriodDays: 7,
  rotationStartDate: NOW,
  currentRotationIndex: 0,
  lastRotatedAt: NOW,
  escalationTimeoutMinutes: 30,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

describe("TeamsService", () => {
  let service: TeamsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [TeamsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TeamsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("create", () => {
    const dto = {
      name: "frontend",
      description: "web team",
      services: ["web"],
      rotationPeriodDays: 7,
      rotationStartDate: new Date("2026-02-01T00:00:00.000Z"),
      timezone: "UTC",
      escalationTimeoutMinutes: 30,
    };

    it("creates a team owned by the caller, converting the start date to UTC", async () => {
      const team = makeTeam();
      prisma.team.create.mockResolvedValue(team);

      const result = await service.create(OWNER_ID, dto);

      expect(result).toBe(team);
      expect(prisma.team.create).toHaveBeenCalledWith({
        data: {
          ownerId: OWNER_ID,
          name: dto.name,
          description: dto.description,
          services: dto.services,
          rotationPeriodDays: dto.rotationPeriodDays,
          rotationStartDate: convertDateToUtc(dto.rotationStartDate, "UTC"),
          escalationTimeoutMinutes: dto.escalationTimeoutMinutes,
        },
        omit: { ownerId: true, createdAt: true, updatedAt: true },
      });
    });

    it("leaves rotationStartDate undefined when none is given", async () => {
      prisma.team.create.mockResolvedValue(makeTeam());

      await service.create(OWNER_ID, { name: "frontend", services: ["web"] });

      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rotationStartDate: undefined }),
        })
      );
    });

    it("throws ConflictException when the team already exists (P2002)", async () => {
      prisma.team.create.mockRejectedValue(prismaError("P2002"));

      await expect(service.create(OWNER_ID, dto)).rejects.toThrow(
        ConflictException
      );
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      prisma.team.create.mockRejectedValue(error);

      await expect(service.create(OWNER_ID, dto)).rejects.toBe(error);
    });
  });

  describe("update", () => {
    it("updates the team, scoped to the owner", async () => {
      const team = makeTeam({ name: "backend" });
      prisma.team.update.mockResolvedValue(team);

      const result = await service.update(OWNER_ID, TEAM_ID, {
        name: "backend",
      });

      expect(result).toBe(team);
      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: TEAM_ID, ownerId: OWNER_ID },
        data: { name: "backend" },
        omit: { ownerId: true, createdAt: true, updatedAt: true },
      });
    });

    it("resets the rotation when rotationPeriodDays changes", async () => {
      prisma.team.update.mockResolvedValue(makeTeam());

      await service.update(OWNER_ID, TEAM_ID, { rotationPeriodDays: 14 });

      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            rotationPeriodDays: 14,
            currentRotationIndex: 0,
            lastRotatedAt: NOW,
          },
        })
      );
    });

    it("doesn't reset the rotation when rotationPeriodDays isn't updated", async () => {
      prisma.team.update.mockResolvedValue(makeTeam());

      await service.update(OWNER_ID, TEAM_ID, { name: "backend" });

      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ currentRotationIndex: 0 }),
        })
      );
    });

    it("throws NotFoundException when the team doesn't exist (P2025)", async () => {
      prisma.team.update.mockRejectedValue(prismaError("P2025"));

      await expect(
        service.update(OWNER_ID, TEAM_ID, { name: "backend" })
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException when the name is taken (P2002)", async () => {
      prisma.team.update.mockRejectedValue(prismaError("P2002"));

      await expect(
        service.update(OWNER_ID, TEAM_ID, { name: "backend" })
      ).rejects.toThrow(ConflictException);
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      prisma.team.update.mockRejectedValue(error);

      await expect(
        service.update(OWNER_ID, TEAM_ID, { name: "backend" })
      ).rejects.toBe(error);
    });
  });

  describe("findAllForOwner", () => {
    it("returns the owner's teams and the total", async () => {
      const teams = [makeTeam(), makeTeam({ id: "t2" })];
      prisma.team.findMany.mockResolvedValue(teams);
      prisma.team.count.mockResolvedValue(2);

      const result = await service.findAllForOwner(OWNER_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({ teams, total: 2 });
      expect(prisma.team.findMany).toHaveBeenCalledWith({
        where: { ownerId: OWNER_ID },
        skip: 0,
        take: 10,
        orderBy: undefined,
        omit: { ownerId: true, updatedAt: true, currentRotationIndex: true },
      });
      expect(prisma.team.count).toHaveBeenCalledWith({
        where: { ownerId: OWNER_ID },
      });
    });

    it("returns an empty list when the owner has no teams", async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);

      const result = await service.findAllForOwner(OWNER_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({ teams: [], total: 0 });
    });

    it("applies the same case-insensitive name search to the page and the count", async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);
      const where = {
        ownerId: OWNER_ID,
        name: { contains: "front", mode: "insensitive" },
      };

      await service.findAllForOwner(OWNER_ID, {
        limit: 10,
        offset: 0,
        search: "front",
      });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where })
      );
      expect(prisma.team.count).toHaveBeenCalledWith({ where });
    });

    it("forwards limit and offset to take and skip", async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);

      await service.findAllForOwner(OWNER_ID, { limit: 5, offset: 15 });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 15 })
      );
    });

    it("forwards sortField and sortOrder to orderBy", async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);

      await service.findAllForOwner(OWNER_ID, {
        limit: 10,
        offset: 0,
        sortField: SORT_FIELD.NAME,
        sortOrder: SORT_ORDER.DESC,
      });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: SORT_ORDER.DESC } })
      );
    });
  });

  describe("findOne", () => {
    it("returns the team, scoped to the owner", async () => {
      const team = makeTeam();
      prisma.team.findUnique.mockResolvedValue(team);

      await expect(service.findOne(OWNER_ID, TEAM_ID)).resolves.toBe(team);
      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID, ownerId: OWNER_ID },
        omit: { ownerId: true, createdAt: true, updatedAt: true },
      });
    });

    it("throws NotFoundException when the team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.findOne(OWNER_ID, TEAM_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("getStats", () => {
    it("returns member, open incident and active unavailability counts", async () => {
      prisma.team.findUnique.mockResolvedValue({
        _count: { teamMembers: 5, incidents: 2 },
      } as never);
      prisma.unavailability.count.mockResolvedValue(1);

      const result = await service.getStats(OWNER_ID, TEAM_ID);

      expect(result).toEqual({
        memberCount: 5,
        openIncidentCount: 2,
        activeUnavailabilityCount: 1,
      });
    });

    it("counts only open incidents", async () => {
      prisma.team.findUnique.mockResolvedValue({
        _count: { teamMembers: 0, incidents: 0 },
      } as never);
      prisma.unavailability.count.mockResolvedValue(0);

      await service.getStats(OWNER_ID, TEAM_ID);

      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID, ownerId: OWNER_ID },
        select: {
          _count: {
            select: {
              incidents: { where: { status: "open" } },
              teamMembers: true,
            },
          },
        },
      });
    });

    it("counts only approved unavailabilities active right now", async () => {
      prisma.team.findUnique.mockResolvedValue({
        _count: { teamMembers: 0, incidents: 0 },
      } as never);
      prisma.unavailability.count.mockResolvedValue(0);

      await service.getStats(OWNER_ID, TEAM_ID);

      expect(prisma.unavailability.count).toHaveBeenCalledWith({
        where: {
          teamMember: { team: { ownerId: OWNER_ID }, teamId: TEAM_ID },
          status: "APPROVED",
          startDate: { lte: NOW },
          endDate: { gte: NOW },
        },
      });
    });

    it("throws NotFoundException when the team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      prisma.unavailability.count.mockResolvedValue(0);

      await expect(service.getStats(OWNER_ID, TEAM_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("remove", () => {
    it("deletes the team, scoped to the owner", async () => {
      prisma.team.delete.mockResolvedValue(makeTeam());

      await expect(service.remove(OWNER_ID, TEAM_ID)).resolves.toBeUndefined();
      expect(prisma.team.delete).toHaveBeenCalledWith({
        where: { id: TEAM_ID, ownerId: OWNER_ID },
      });
    });

    it("throws NotFoundException when the team doesn't exist (P2025)", async () => {
      prisma.team.delete.mockRejectedValue(prismaError("P2025"));

      await expect(service.remove(OWNER_ID, TEAM_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      prisma.team.delete.mockRejectedValue(error);

      await expect(service.remove(OWNER_ID, TEAM_ID)).rejects.toBe(error);
    });
  });
});
