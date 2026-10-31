import { Test } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { DateTime } from "luxon";
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

    // Client handed to the transaction callback. Kept separate from `prisma`
    // so a query that wrongly goes through the root client is caught.
    let tx: MockPrisma;

    beforeEach(() => {
      tx = createMockPrisma();
      prisma.$transaction.mockImplementation(((
        callback: (client: unknown) => unknown
      ) => callback(tx)) as never);

      prisma.teamMember.findUnique.mockResolvedValue(makeMember() as never);
      tx.$queryRaw.mockResolvedValue([{ id: MEMBER_ID }] as never);
      tx.unavailability.findMany.mockResolvedValue([]);
    });

    it("looks for an overlapping pending or approved window of the same member", async () => {
      tx.unavailability.create.mockResolvedValue(makeUnavailability() as never);

      await service.request(USER_ID, TEAM_ID, MEMBER_ID, dto);

      expect(tx.unavailability.findMany).toHaveBeenCalledWith({
        where: {
          memberId: MEMBER_ID,
          status: { in: ["PENDING", "APPROVED"] },
        },
        select: { startDate: true, endDate: true },
      });
    });

    it("locks the member row, checks for overlaps, then inserts, in that order", async () => {
      tx.unavailability.create.mockResolvedValue(makeUnavailability() as never);

      await service.request(USER_ID, TEAM_ID, MEMBER_ID, dto);

      const lock = tx.$queryRaw.mock.invocationCallOrder[0];
      const check = tx.unavailability.findMany.mock.invocationCallOrder[0];
      const insert = tx.unavailability.create.mock.invocationCallOrder[0];
      expect(lock).toBeLessThan(check);
      expect(check).toBeLessThan(insert);
    });

    it("takes a FOR UPDATE lock on the requested member", async () => {
      tx.unavailability.create.mockResolvedValue(makeUnavailability() as never);

      await service.request(USER_ID, TEAM_ID, MEMBER_ID, dto);

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      const [strings, ...values] = tx.$queryRaw.mock.calls[0] as unknown as [
        TemplateStringsArray,
        ...unknown[],
      ];
      expect(strings.join("?")).toContain("FOR UPDATE");
      expect(values).toEqual([MEMBER_ID]);
    });

    it("runs the check and the insert inside one transaction, never on the root client", async () => {
      tx.unavailability.create.mockResolvedValue(makeUnavailability() as never);

      await service.request(USER_ID, TEAM_ID, MEMBER_ID, dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.unavailability.findMany).toHaveBeenCalledTimes(1);
      expect(tx.unavailability.create).toHaveBeenCalledTimes(1);
      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
      expect(prisma.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws ConflictException when the window overlaps an existing one", async () => {
      tx.unavailability.findMany.mockResolvedValue([
        makeUnavailability(),
      ] as never);

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow("Unavailability overlaps an existing request");
      expect(tx.unavailability.create).not.toHaveBeenCalled();
    });

    it("creates a pending window with timezone-aware day boundaries", async () => {
      await service.request(USER_ID, TEAM_ID, MEMBER_ID, dto);

      expect(tx.unavailability.create).toHaveBeenCalledWith({
        data: {
          memberId: MEMBER_ID,
          startDate: convertDateToUtc(dto.startDate, dto.timezone),
          endDate: convertDateToUtc(dto.endDate, dto.timezone, true),
          reason: "vacation",
        },
      });
    });

    it("allows a window that starts today", async () => {
      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2026-01-15T00:00:00.000Z"),
        })
      ).resolves.toBeUndefined();
    });

    it("does not treat adjacent days as overlapping, even with a non-UTC offset", async () => {
      // Jan 21-Jan 29 in Africa/Casablanca (UTC+1) is adjacent to an existing
      // Jan 17-Jan 20 window. Storing timezone-aware boundaries shifts the start
      // to Jan 20 23:00Z, so the day-granular overlap check must still not
      // collide with a window ending on Jan 20.
      tx.unavailability.findMany.mockResolvedValue([
        makeUnavailability({
          id: 99,
          // Jan 17 - Jan 20 as properly stored for Africa/Casablanca (UTC+1)
          startDate: new Date("2027-01-16T23:00:00.000Z"),
          endDate: new Date("2027-01-20T22:59:59.999Z"),
        }),
      ] as never);

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2027-01-21T00:00:00.000Z"),
          endDate: new Date("2027-01-29T00:00:00.000Z"),
          timezone: "Africa/Casablanca",
        })
      ).resolves.toBeUndefined();

      const [createArgs] = tx.unavailability.create.mock
        .calls[0] as unknown as [{ data: { startDate: Date; endDate: Date } }];

      // Assert the offset relative to the input rather than a hard-coded UTC
      // instant, so the test stays valid regardless of the runner's tz database
      // version (Morocco's rules change with Ramadan).
      const offsetMs =
        DateTime.fromObject(
          { year: 2027, month: 1, day: 21 },
          { zone: "Africa/Casablanca" }
        ).offset *
        60 *
        1000;

      // Jan 21 00:00 local = start of day shifted back by the zone offset
      expect(createArgs.data.startDate).toEqual(
        new Date(new Date("2027-01-21T00:00:00.000Z").getTime() - offsetMs)
      );
      // Jan 29 end-of-day local = 23:59:59.999 local shifted back by the offset
      expect(createArgs.data.endDate).toEqual(
        new Date(new Date("2027-01-29T23:59:59.999Z").getTime() - offsetMs)
      );
    });

    it("throws NotFoundException when the member isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when requesting for someone else", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(
        makeMember({ userId: OTHER_ID }) as never
      );

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the start date is in the past", async () => {
      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2026-01-14T00:00:00.000Z"),
        })
      ).rejects.toThrow("Start date can't be in the past");
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the start date is after the end date", async () => {
      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, {
          ...dto,
          startDate: new Date("2026-01-25T00:00:00.000Z"),
          endDate: new Date("2026-01-20T00:00:00.000Z"),
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.unavailability.create).not.toHaveBeenCalled();
    });

    it("throws ConflictException when the window already exists (P2002)", async () => {
      tx.unavailability.create.mockRejectedValue(prismaError("P2002"));

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toThrow(ConflictException);
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      tx.unavailability.create.mockRejectedValue(error);

      await expect(
        service.request(USER_ID, TEAM_ID, MEMBER_ID, dto)
      ).rejects.toBe(error);
    });
  });

  describe("update", () => {
    const existing = makeUnavailability();
    const dto = {
      startDate: new Date("2026-01-25T00:00:00.000Z"),
      endDate: new Date("2026-01-27T00:00:00.000Z"),
      timezone: "UTC",
      reason: "conference",
    };

    // Kept separate from `prisma` so a query that wrongly goes through the root
    // client instead of the transaction client is caught.
    let tx: MockPrisma;

    beforeEach(() => {
      tx = createMockPrisma();
      prisma.$transaction.mockImplementation(((
        callback: (client: unknown) => unknown
      ) => callback(tx)) as never);

      prisma.teamMember.findUnique.mockResolvedValue(makeMember() as never);
      prisma.unavailability.findUnique.mockResolvedValue(existing as never);
      tx.$queryRaw.mockResolvedValue([{ id: MEMBER_ID }] as never);
      tx.unavailability.findMany.mockResolvedValue([]);
      tx.unavailability.updateMany.mockResolvedValue({ count: 1 });
    });

    it("updates the pending window with the new timezone-aware boundaries and reason", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      expect(tx.unavailability.updateMany).toHaveBeenCalledWith({
        where: {
          id: UNAVAILABILITY_ID,
          memberId: MEMBER_ID,
          status: "PENDING",
        },
        data: {
          startDate: convertDateToUtc(dto.startDate, dto.timezone),
          endDate: convertDateToUtc(dto.endDate, dto.timezone, true),
          reason: "conference",
        },
      });
    });

    it("replaces the reason with the provided value", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      expect(tx.unavailability.updateMany).toHaveBeenCalledTimes(1);
      const [args] = tx.unavailability.updateMany.mock.calls[0] as unknown as [
        { data: { reason: string | null } },
      ];
      expect(args.data.reason).toBe("conference");
    });

    it("excludes the record being updated from the overlap check", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      expect(tx.unavailability.findMany).toHaveBeenCalledWith({
        where: {
          memberId: MEMBER_ID,
          id: { not: UNAVAILABILITY_ID },
          status: { in: ["PENDING", "APPROVED"] },
        },
        select: { startDate: true, endDate: true },
      });
    });

    it("locks the member row, checks for overlaps, then updates, in that order", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      const lock = tx.$queryRaw.mock.invocationCallOrder[0];
      const check = tx.unavailability.findMany.mock.invocationCallOrder[0];
      const write = tx.unavailability.updateMany.mock.invocationCallOrder[0];
      expect(lock).toBeLessThan(check);
      expect(check).toBeLessThan(write);
    });

    it("takes a FOR UPDATE lock on the requested member", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      const [strings, ...values] = tx.$queryRaw.mock.calls[0] as unknown as [
        TemplateStringsArray,
        ...unknown[],
      ];
      expect(strings.join("?")).toContain("FOR UPDATE");
      expect(values).toEqual([MEMBER_ID]);
    });

    it("runs the check and the update inside one transaction, never on the root client", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.unavailability.findMany).toHaveBeenCalledTimes(1);
      expect(tx.unavailability.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
      expect(prisma.unavailability.updateMany).not.toHaveBeenCalled();
    });

    it("scopes the write to the pending status so a concurrent approval can't be clobbered", async () => {
      await service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto);

      const [args] = tx.unavailability.updateMany.mock.calls[0] as unknown as [
        { where: { status: string } },
      ];
      expect(args.where.status).toBe("PENDING");
    });

    it("throws ConflictException when the window was modified concurrently (count=0)", async () => {
      tx.unavailability.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow(
        "Unavailability was modified or removed by another request"
      );
    });

    it("throws ConflictException when the new window collides with an existing one (P2002)", async () => {
      tx.unavailability.updateMany.mockRejectedValue(prismaError("P2002"));

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow("Unavailability window already exists");
    });

    it("throws ConflictException when the new window overlaps an existing one", async () => {
      tx.unavailability.findMany.mockResolvedValue([
        makeUnavailability({
          id: 99,
          startDate: new Date("2026-01-26T00:00:00.000Z"),
          endDate: new Date("2026-01-28T23:59:59.999Z"),
        }),
      ] as never);

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow("Unavailability overlaps an existing request");
      expect(tx.unavailability.updateMany).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the unavailability doesn't exist", async () => {
      prisma.unavailability.findUnique.mockResolvedValue(null);

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws ConflictException when the unavailability isn't pending", async () => {
      prisma.unavailability.findUnique.mockResolvedValue(
        makeUnavailability({ status: "APPROVED" }) as never
      );
      // the atomic status filter in the update matches nothing
      tx.unavailability.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow(
        "Unavailability was modified or removed by another request"
      );
    });

    it("throws NotFoundException when the member isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.unavailability.findUnique).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when updating someone else's unavailability", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(
        makeMember({ userId: OTHER_ID }) as never
      );

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.unavailability.updateMany).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the start date is in the past", async () => {
      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
          ...dto,
          startDate: new Date("2026-01-14T00:00:00.000Z"),
        })
      ).rejects.toThrow("Start date can't be in the past");
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.unavailability.updateMany).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the start date is after the end date", async () => {
      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
          ...dto,
          startDate: new Date("2026-01-28T00:00:00.000Z"),
          endDate: new Date("2026-01-25T00:00:00.000Z"),
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.unavailability.updateMany).not.toHaveBeenCalled();
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      tx.unavailability.updateMany.mockRejectedValue(error);

      await expect(
        service.update(USER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, dto)
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

  describe("findTeammatesAway", () => {
    beforeEach(() => {
      prisma.teamMember.findUnique.mockResolvedValue({
        id: MEMBER_ID,
      } as never);
    });

    it("throws NotFoundException when the requester isn't in the team", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.findTeammatesAway(USER_ID, TEAM_ID)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: { teamId: TEAM_ID, userId: USER_ID },
        select: { id: true },
      });
      expect(prisma.teamMember.findMany).not.toHaveBeenCalled();
    });

    const active = {
      status: "APPROVED",
      endDate: { gte: NOW },
    };

    it("returns the away teammates with their approved, unexpired windows", async () => {
      const away = [
        {
          user: {
            firstName: "Ada",
            lastName: "Lovelace",
            specialty: "Backend",
          },
          unavailabilities: [
            {
              startDate: new Date("2026-01-20T00:00:00.000Z"),
              endDate: new Date("2026-01-22T23:59:59.999Z"),
            },
          ],
        },
      ];
      prisma.teamMember.findMany.mockResolvedValue(away as never);

      await expect(
        service.findTeammatesAway(USER_ID, TEAM_ID)
      ).resolves.toEqual(away);
    });

    it("returns an empty list when nobody is away", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);

      await expect(
        service.findTeammatesAway(USER_ID, TEAM_ID)
      ).resolves.toEqual([]);
    });

    it("excludes the requester and applies the same filter to members and windows", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);

      await service.findTeammatesAway(USER_ID, TEAM_ID);

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
        where: {
          teamId: TEAM_ID,
          NOT: { userId: USER_ID },
          unavailabilities: { some: active },
        },
        select: {
          user: {
            select: { firstName: true, lastName: true, specialty: true },
          },
          unavailabilities: {
            where: active,
            select: { startDate: true, endDate: true },
            orderBy: { startDate: "asc" },
          },
        },
      });
    });

    it("never selects the reason or status", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);

      await service.findTeammatesAway(USER_ID, TEAM_ID);

      const [{ select }] = prisma.teamMember.findMany.mock.calls[0] as [
        { select: { unavailabilities: { select: object } } },
      ];
      expect(Object.keys(select.unavailabilities.select)).toEqual([
        "startDate",
        "endDate",
      ]);
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
      prisma.unavailability.updateMany.mockResolvedValue({ count: 1 });
    });

    it(`sets a pending unavailability to ${target}`, async () => {
      await expect(run()).resolves.toBeUndefined();

      expect(prisma.unavailability.findUnique).toHaveBeenCalledWith({
        where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
      });
      expect(prisma.unavailability.updateMany).toHaveBeenCalledWith({
        where: {
          id: UNAVAILABILITY_ID,
          memberId: MEMBER_ID,
          status: "PENDING",
        },
        data: { status: target },
      });
    });

    it("throws BadRequestException when another request changed the status first", async () => {
      // passed the pending check, but a concurrent approve/reject won the update
      prisma.unavailability.updateMany.mockResolvedValue({ count: 0 });

      await expect(run()).rejects.toThrow(BadRequestException);
    });

    it("throws NotFoundException when the requester doesn't own the team", async () => {
      prisma.team.findUnique.mockResolvedValue(
        makeTeam({ ownerId: OTHER_ID }) as never
      );

      await expect(run()).rejects.toThrow(NotFoundException);
      expect(prisma.unavailability.updateMany).not.toHaveBeenCalled();
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
        expect(prisma.unavailability.updateMany).not.toHaveBeenCalled();
      }
    );
  });

  describe("reviewing an unavailability that has already ended", () => {
    beforeEach(() => {
      prisma.team.findUnique.mockResolvedValue(makeTeam() as never);
      prisma.teamMember.findUnique.mockResolvedValue(makeMember() as never);
      // still PENDING because the expiry cron hasn't run yet
      prisma.unavailability.findUnique.mockResolvedValue(
        makeUnavailability({
          endDate: new Date("2026-01-14T23:59:59.999Z"),
        }) as never
      );
      prisma.unavailability.updateMany.mockResolvedValue({ count: 1 });
    });

    it("refuses to approve it", async () => {
      await expect(
        service.approve(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(
        "Cannot approve an unavailability that has already ended"
      );
      expect(prisma.unavailability.updateMany).not.toHaveBeenCalled();
    });

    it("refuses to reject it", async () => {
      await expect(
        service.reject(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(
        "Cannot reject an unavailability that has already ended"
      );
      expect(prisma.unavailability.updateMany).not.toHaveBeenCalled();
    });
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
