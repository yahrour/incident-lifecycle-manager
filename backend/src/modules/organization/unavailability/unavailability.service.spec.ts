import { Test } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { convertDateToUtc } from "@/common/utils/timezone";
import { SORT_ORDER } from "@/common/constants";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { UnavailabilityService } from "./unavailability.service";
import { FILTER_FIELD, SORT_FIELD } from "./constants";

const TEAM_ID = "teamId";
const OWNER_ID = "ownerId";
const USER_ID = "userId";
const OTHER_ID = "otherId";
const MEMBER_ID = 1;
const UNAVAILABILITY_ID = 10;
const NOW = new Date("2026-01-15T12:00:00.000Z");

const prismaError = (code: string) =>
  new PrismaClientKnownRequestError(code, { code, clientVersion: "5.0.0" });

const makeTeam = (overrides = {}) => ({
  id: TEAM_ID,
  ownerId: OWNER_ID,
  ...overrides,
});

const makeMember = (overrides = {}) => ({
  id: MEMBER_ID,
  userId: USER_ID,
  teamId: TEAM_ID,
  ...overrides,
});

const makeUnavailability = (overrides = {}) => ({
  id: UNAVAILABILITY_ID,
  memberId: MEMBER_ID,
  startDate: new Date("2026-01-20T00:00:00.000Z"),
  endDate: new Date("2026-01-22T23:59:59.999Z"),
  reason: null,
  status: "PENDING",
  createdAt: NOW,
  ...overrides,
});

const baseQuery = {
  limit: 10,
  offset: 0,
  filterField: FILTER_FIELD.ALL,
};

describe("UnavailabilityService", () => {
  let service: UnavailabilityService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        UnavailabilityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(UnavailabilityService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("request", () => {
    const dto = {
      startDate: new Date("2026-01-20T00:00:00.000Z"),
      endDate: new Date("2026-01-22T00:00:00.000Z"),
      timezone: "UTC",
      reason: "vacation",
    };

    beforeEach(() => {
      prisma.teamMember.findUnique.mockResolvedValue(makeMember() as never);
    });

    it("creates a pending window with UTC day boundaries", async () => {
      const created = makeUnavailability();
      prisma.unavailability.create.mockResolvedValue(created as never);

      const result = await service.request(USER_ID, TEAM_ID, MEMBER_ID, dto);

      expect(result).toBe(created);
      expect(prisma.unavailability.create).toHaveBeenCalledWith({
        data: {
          memberId: MEMBER_ID,
          startDate: convertDateToUtc(dto.startDate, "UTC"),
          endDate: convertDateToUtc(dto.endDate, "UTC", true),
          reason: "vacation",
        },
      });
    });

    it("allows a window that starts today", async () => {
      prisma.unavailability.create.mockResolvedValue(
        makeUnavailability() as never
      );

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2026-01-15T00:00:00.000Z"),
        })
      ).resolves.toBeDefined();
    });

    it("throws NotFoundException when the member isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException when requesting for someone else", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(
        makeMember({ userId: OTHER_ID }) as never
      );

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the start date is in the past", async () => {
      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2026-01-14T00:00:00.000Z"),
        })
      ).rejects.toThrow("Start date can't be in the past");
      expect(prisma.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the start date is after the end date", async () => {
      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2026-01-25T00:00:00.000Z"),
          endDate: new Date("2026-01-20T00:00:00.000Z"),
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws ConflictException when the window already exists (P2002)", async () => {
      prisma.unavailability.create.mockRejectedValue(prismaError("P2002"));

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow(ConflictException);
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      prisma.unavailability.create.mockRejectedValue(error);

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toBe(error);
    });
  });

  describe("findByMember", () => {
    beforeEach(() => {
      prisma.unavailability.findMany.mockResolvedValue([]);
      prisma.unavailability.count.mockResolvedValue(0);
    });

    it("lets the member read their own unavailabilities", async () => {
      prisma.teamMember.findUnique.mockResolvedValue({
        ...makeMember(),
        team: makeTeam(),
      } as never);
      const rows = [makeUnavailability()];
      prisma.unavailability.findMany.mockResolvedValue(rows as never);
      prisma.unavailability.count.mockResolvedValue(1);

      const result = await service.findByMember(
        USER_ID,
        TEAM_ID,
        MEMBER_ID,
        baseQuery
      );

      expect(result).toEqual({ unavailabilities: rows, total: 1 });
      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { memberId: MEMBER_ID },
          skip: 0,
          take: 10,
        })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledWith({
        where: { memberId: MEMBER_ID },
      });
    });

    it("lets the team owner read a member's unavailabilities", async () => {
      prisma.teamMember.findUnique.mockResolvedValue({
        ...makeMember(),
        team: makeTeam(),
      } as never);

      await expect(
        service.findByMember(OWNER_ID, TEAM_ID, MEMBER_ID, baseQuery)
      ).resolves.toEqual({ unavailabilities: [], total: 0 });
    });

    it("throws ForbiddenException for anyone else", async () => {
      prisma.teamMember.findUnique.mockResolvedValue({
        ...makeMember(),
        team: makeTeam(),
      } as never);

      await expect(
        service.findByMember(OTHER_ID, TEAM_ID, MEMBER_ID, baseQuery)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the member isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findByMember(USER_ID, TEAM_ID, MEMBER_ID, baseQuery)
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      [FILTER_FIELD.PENDING, "PENDING"],
      [FILTER_FIELD.APPROVED, "APPROVED"],
      [FILTER_FIELD.REJECTED, "REJECTED"],
      [FILTER_FIELD.EXPIRED, "EXPIRED"],
    ])("maps the %s filter to status %s", async (filterField, status) => {
      prisma.teamMember.findUnique.mockResolvedValue({
        ...makeMember(),
        team: makeTeam(),
      } as never);

      await service.findByMember(USER_ID, TEAM_ID, MEMBER_ID, {
        ...baseQuery,
        filterField,
      });

      const where = { memberId: MEMBER_ID, status };
      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledWith({ where });
    });

    it("sorts with id as a tiebreaker", async () => {
      prisma.teamMember.findUnique.mockResolvedValue({
        ...makeMember(),
        team: makeTeam(),
      } as never);

      await service.findByMember(USER_ID, TEAM_ID, MEMBER_ID, {
        ...baseQuery,
        sortField: SORT_FIELD.CREATED_AT,
        sortOrder: SORT_ORDER.DESC,
      });

      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: SORT_ORDER.DESC }, { id: SORT_ORDER.DESC }],
        })
      );
    });
  });

  describe("cancel", () => {
    beforeEach(() => {
      prisma.teamMember.findUnique.mockResolvedValue({
        ...makeMember(),
        team: makeTeam(),
      } as never);
    });

    it("deletes the member's pending unavailability", async () => {
      prisma.unavailability.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        service.cancel(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).resolves.toBeUndefined();

      expect(prisma.unavailability.deleteMany).toHaveBeenCalledWith({
        where: {
          id: UNAVAILABILITY_ID,
          memberId: MEMBER_ID,
          status: "PENDING",
        },
      });
    });

    it("throws NotFoundException when nothing matches (missing, other member's, or not pending)", async () => {
      prisma.unavailability.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.cancel(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException for a requester who is neither the member nor the owner", async () => {
      await expect(
        service.cancel(OTHER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.unavailability.deleteMany).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the member isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.cancel(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByTeam", () => {
    beforeEach(() => {
      prisma.team.findUnique.mockResolvedValue(makeTeam() as never);
      prisma.unavailability.findMany.mockResolvedValue([]);
      prisma.unavailability.count.mockResolvedValue(0);
    });

    it("returns the team's unavailabilities and total", async () => {
      const rows = [makeUnavailability()];
      prisma.unavailability.findMany.mockResolvedValue(rows as never);
      prisma.unavailability.count.mockResolvedValue(1);

      const result = await service.findByTeam(OWNER_ID, TEAM_ID, baseQuery);

      expect(result).toEqual({ unavailabilities: rows, total: 1 });
      const where = {
        teamMember: { teamId: TEAM_ID, team: { ownerId: OWNER_ID } },
      };
      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where, skip: 0, take: 10 })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledWith({ where });
    });

    it("throws NotFoundException when the team doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(
        service.findByTeam(OWNER_ID, TEAM_ID, baseQuery)
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when the requester doesn't own the team", async () => {
      await expect(
        service.findByTeam(OTHER_ID, TEAM_ID, baseQuery)
      ).rejects.toThrow(NotFoundException);
      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
    });

    it("applies the status filter to the page and the count", async () => {
      await service.findByTeam(OWNER_ID, TEAM_ID, {
        ...baseQuery,
        filterField: FILTER_FIELD.PENDING,
      });

      const where = {
        teamMember: { teamId: TEAM_ID, team: { ownerId: OWNER_ID } },
        status: "PENDING",
      };
      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledWith({ where });
    });

    it("sorts with id as a tiebreaker", async () => {
      await service.findByTeam(OWNER_ID, TEAM_ID, {
        ...baseQuery,
        sortField: SORT_FIELD.CREATED_AT,
        sortOrder: SORT_ORDER.ASC,
      });

      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: SORT_ORDER.ASC }, { id: SORT_ORDER.ASC }],
        })
      );
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      prisma.unavailability.findMany.mockRejectedValue(error);

      await expect(
        service.findByTeam(OWNER_ID, TEAM_ID, baseQuery)
      ).rejects.toBe(error);
    });
  });

  describe("findAllForOwner", () => {
    it("returns unavailabilities across all of the owner's teams", async () => {
      const rows = [makeUnavailability()];
      prisma.unavailability.findMany.mockResolvedValue(rows as never);
      prisma.unavailability.count.mockResolvedValue(1);

      const result = await service.findAllForOwner(OWNER_ID, baseQuery);

      expect(result).toEqual({ unavailabilities: rows, total: 1 });
      const where = { teamMember: { team: { ownerId: OWNER_ID } } };
      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where, skip: 0, take: 10 })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledWith({ where });
    });

    it("applies the status filter to the page and the count", async () => {
      prisma.unavailability.findMany.mockResolvedValue([]);
      prisma.unavailability.count.mockResolvedValue(0);

      await service.findAllForOwner(OWNER_ID, {
        ...baseQuery,
        filterField: FILTER_FIELD.APPROVED,
      });

      const where = {
        teamMember: { team: { ownerId: OWNER_ID } },
        status: "APPROVED",
      };
      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledWith({ where });
    });
  });

  describe.each([
    ["approve", "APPROVED"],
    ["reject", "REJECTED"],
  ] as const)("%s", (method, target) => {
    const run = () =>
      service[method](OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID);

    beforeEach(() => {
      prisma.team.findUnique.mockResolvedValue(makeTeam() as never);
      prisma.teamMember.findUnique.mockResolvedValue(makeMember() as never);
      prisma.unavailability.findUnique.mockResolvedValue(
        makeUnavailability() as never
      );
    });

    it(`sets a pending unavailability to ${target}`, async () => {
      await expect(run()).resolves.toBeUndefined();

      expect(prisma.unavailability.findUnique).toHaveBeenCalledWith({
        where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
      });
      expect(prisma.unavailability.update).toHaveBeenCalledWith({
        where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
        data: { status: target },
      });
    });

    it("throws NotFoundException when the requester doesn't own the team", async () => {
      prisma.team.findUnique.mockResolvedValue(
        makeTeam({ ownerId: OTHER_ID }) as never
      );

      await expect(run()).rejects.toThrow(NotFoundException);
      expect(prisma.unavailability.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the member isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(run()).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when the unavailability doesn't exist", async () => {
      prisma.unavailability.findUnique.mockResolvedValue(null);

      await expect(run()).rejects.toThrow(NotFoundException);
    });

    it.each(["APPROVED", "REJECTED", "EXPIRED"])(
      "throws BadRequestException when the unavailability is already %s",
      async (status) => {
        prisma.unavailability.findUnique.mockResolvedValue(
          makeUnavailability({ status }) as never
        );

        await expect(run()).rejects.toThrow(BadRequestException);
        expect(prisma.unavailability.update).not.toHaveBeenCalled();
      }
    );
  });

  describe("expireOverduePending", () => {
    it("expires pending unavailabilities whose end date has passed", async () => {
      await service.expireOverduePending();

      expect(prisma.unavailability.updateMany).toHaveBeenCalledWith({
        where: { status: "PENDING", endDate: { lt: NOW } },
        data: { status: "EXPIRED" },
      });
    });
  });
});
