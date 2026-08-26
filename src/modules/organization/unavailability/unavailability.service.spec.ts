/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test } from "@nestjs/testing";
import { PrismaService } from "@/common/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { convertDateToUtc } from "@/common/utils/timezone";
import { UnavailabilityService } from "./unavailability.service";
import { SORT_FIELD } from "./constants";
import { SORT_ORDER } from "@/common/constants";

const TEAM_ID = "teamId";
const OWNER_ID = "ownerId";
const MEMBER_ID = 1;
const UNAVAILABILITY_ID = 10;
const NOW_DATE = new Date("2026-01-15T00:00:00.000Z");

const makeTeam = () => ({
  id: TEAM_ID,
  ownerId: OWNER_ID,
  name: "frontend",
  description: "frontend team",
  rotationPeriodDays: 7,
  rotationStartDate: NOW_DATE,
  escalationTimeoutMinutes: 30,
  currentRotationIndex: 0,
  lastNotifiedRotationIndex: 0,
  lastRotatedAt: NOW_DATE,
  webhookUrl: null,
  createdAt: NOW_DATE,
  updatedAt: NOW_DATE,
});

const makeTeamMember = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: MEMBER_ID,
  teamId: TEAM_ID,
  userId: "userId",
  isCaptain: false,
  joinedAt: NOW_DATE,
  createdAt: NOW_DATE,
  updatedAt: NOW_DATE,
  team: makeTeam(),
  ...overrides,
});

const makeUnavailability = (overrides: Record<string, unknown> = {}) => ({
  id: UNAVAILABILITY_ID,
  memberId: MEMBER_ID,
  startDate: NOW_DATE,
  endDate: new Date("2026-01-16T00:00:00.000Z"),
  reason: "vacation",
  confirmed: false,
  createdAt: NOW_DATE,
  updatedAt: NOW_DATE,
  ...overrides,
});

const encodeCursor = (cursor: {
  id: number;
  sortField: SORT_FIELD;
  sortOrder: SORT_ORDER;
}) => Buffer.from(JSON.stringify(cursor)).toString("base64url");

describe("UnavailabilityService", () => {
  let service: UnavailabilityService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW_DATE);

    prisma = createMockPrisma();

    const module = await Test.createTestingModule({
      providers: [
        UnavailabilityService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UnavailabilityService>(UnavailabilityService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createUnavailabilityDto = {
      startDate: new Date("2026-01-20T10:00:00.000Z"),
      endDate: new Date("2026-01-21T10:00:00.000Z"),
      timezone: "America/New_York",
      reason: "sick leave",
    };

    it("should create a confirmed unavailability when the requester is the team owner", async () => {
      // requester is the team owner
      prisma.teamMember.findUnique.mockResolvedValue(
        makeTeamMember({ userId: OWNER_ID })
      );

      const created = makeUnavailability({ confirmed: true });

      prisma.unavailability.create.mockResolvedValue(created);

      const result = await service.create(
        OWNER_ID,
        TEAM_ID,
        MEMBER_ID,
        createUnavailabilityDto
      );

      expect(result).toEqual(created);

      expect(prisma.unavailability.create).toHaveBeenCalledWith({
        data: {
          memberId: MEMBER_ID,
          startDate: convertDateToUtc(
            createUnavailabilityDto.startDate,
            createUnavailabilityDto.timezone
          ),
          endDate: convertDateToUtc(
            createUnavailabilityDto.endDate,
            createUnavailabilityDto.timezone,
            true
          ),
          reason: createUnavailabilityDto.reason,
          confirmed: true,
        },
      });
    });

    it("should create an unconfirmed unavailability when the requester is not the team owner", async () => {
      // requester is an ordinary member, not the owner
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());

      const created = makeUnavailability({ confirmed: false });

      prisma.unavailability.create.mockResolvedValue(created);

      // requester is the member themselves (authorized but not the owner)
      prisma.unavailability.create.mockResolvedValue(
        makeUnavailability({ confirmed: false })
      );

      await service.create(
        "userId",
        TEAM_ID,
        MEMBER_ID,
        createUnavailabilityDto
      );

      expect(prisma.unavailability.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ confirmed: false }),
        })
      );
    });

    it("should throw BadRequestException when start date is after end date", async () => {
      await expect(
        service.create(OWNER_ID, TEAM_ID, MEMBER_ID, {
          ...createUnavailabilityDto,
          startDate: new Date("2026-01-22T10:00:00.000Z"), // after endDate
        })
      ).rejects.toThrow(BadRequestException);

      expect(prisma.unavailability.create).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when the requester is unauthorized", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create("other", TEAM_ID, MEMBER_ID, createUnavailabilityDto)
      ).rejects.toThrow(NotFoundException);

      expect(prisma.unavailability.create).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when an overlapping unavailability exists", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());

      prisma.unavailability.create.mockRejectedValue(
        new PrismaClientKnownRequestError("window exists", {
          code: "P2002",
          clientVersion: "5.0.0",
        })
      );

      await expect(
        service.create(OWNER_ID, TEAM_ID, MEMBER_ID, createUnavailabilityDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("verifyTeamOwnership", () => {
    it("should throw NotFoundException when the team does not exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(
        service.findTeamAll(OWNER_ID, TEAM_ID, {
          limit: 20,
          sortField: SORT_FIELD.CREATED_AT,
          sortOrder: SORT_ORDER.ASC,
        })
      ).rejects.toThrow(NotFoundException);

      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the requester is not the owner", async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());

      await expect(
        service.findTeamAll("notTheOwner", TEAM_ID, {
          limit: 20,
          sortField: SORT_FIELD.CREATED_AT,
          sortOrder: SORT_ORDER.ASC,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findTeamAll", () => {
    const defaultQuery = {
      limit: 20,
      sortField: SORT_FIELD.CREATED_AT,
      sortOrder: SORT_ORDER.ASC,
    };

    beforeEach(() => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
    });

    it("should return unavailabilities scoped to the team without a next cursor when there is no next page", async () => {
      const unavailabilities = [makeUnavailability({ id: 1 })];

      prisma.unavailability.findMany.mockResolvedValue(unavailabilities);

      const result = await service.findTeamAll(OWNER_ID, TEAM_ID, defaultQuery);

      expect(result).toEqual({ unavailabilities, nextCursor: null });

      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            teamMember: {
              teamId: TEAM_ID,
              team: { ownerId: OWNER_ID },
            },
          },
          take: defaultQuery.limit + 1,
          orderBy: [
            { [defaultQuery.sortField]: defaultQuery.sortOrder },
            { id: defaultQuery.sortOrder },
          ],
        })
      );
    });

    it("should return an empty list and no next cursor when there are no unavailabilities", async () => {
      prisma.unavailability.findMany.mockResolvedValue([]);

      const result = await service.findTeamAll(OWNER_ID, TEAM_ID, defaultQuery);

      expect(result).toEqual({ unavailabilities: [], nextCursor: null });
    });

    it("should truncate results to the limit and return a next cursor when more pages follow", async () => {
      prisma.unavailability.findMany.mockResolvedValue([
        makeUnavailability({ id: 1 }),
        makeUnavailability({ id: 2 }),
        makeUnavailability({ id: 3 }),
      ]);

      const result = await service.findTeamAll(OWNER_ID, TEAM_ID, {
        ...defaultQuery,
        limit: 2,
      });

      expect(result.unavailabilities).toEqual([
        makeUnavailability({ id: 1 }),
        makeUnavailability({ id: 2 }),
      ]);

      const decodedCursor = result.nextCursor
        ? JSON.parse(
            Buffer.from(result.nextCursor, "base64url").toString("utf-8")
          )
        : null;
      expect(decodedCursor).toEqual({
        id: 2,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });
    });

    it("should skip the cursor record when a cursor is provided", async () => {
      const cursorId = 5;
      const cursor = encodeCursor({
        id: cursorId,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });

      prisma.unavailability.findMany.mockResolvedValue([
        makeUnavailability({ id: 6 }),
      ]);

      await service.findTeamAll(OWNER_ID, TEAM_ID, {
        ...defaultQuery,
        cursor,
      });

      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: { id: cursorId },
        })
      );
    });

    it("should combine cursor pagination with truncation and produce the next cursor", async () => {
      const cursorId = 5;
      const cursor = encodeCursor({
        id: cursorId,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });

      // 3 rows returned (2 fit the page, 1 signals a next page)
      prisma.unavailability.findMany.mockResolvedValue([
        makeUnavailability({ id: 6 }),
        makeUnavailability({ id: 7 }),
        makeUnavailability({ id: 8 }),
      ]);

      const result = await service.findTeamAll(OWNER_ID, TEAM_ID, {
        ...defaultQuery,
        cursor,
        limit: 2,
      });

      expect(result.unavailabilities).toEqual([
        makeUnavailability({ id: 6 }),
        makeUnavailability({ id: 7 }),
      ]);

      const decodedCursor = result.nextCursor
        ? JSON.parse(
            Buffer.from(result.nextCursor, "base64url").toString("utf-8")
          )
        : null;
      expect(decodedCursor).toEqual({
        id: 7,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });
    });

    it("should throw BadRequestException when the cursor sort parameters do not match the query", async () => {
      // sortOrder mismatch
      const cursor = encodeCursor({
        id: 5,
        sortField: defaultQuery.sortField,
        sortOrder: SORT_ORDER.DESC,
      });

      await expect(
        service.findTeamAll(OWNER_ID, TEAM_ID, {
          ...defaultQuery,
          cursor,
        })
      ).rejects.toThrow(BadRequestException);

      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when the cursor is invalid", async () => {
      await expect(
        service.findTeamAll(OWNER_ID, TEAM_ID, {
          ...defaultQuery,
          cursor: "not-a-valid-cursor",
        })
      ).rejects.toThrow(BadRequestException);

      expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the cursor references a deleted unavailability", async () => {
      const cursor = encodeCursor({
        id: 5,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });

      prisma.unavailability.findMany.mockRejectedValue(
        new PrismaClientKnownRequestError("Record not found", {
          code: "P2025",
          clientVersion: "5.0.0",
        })
      );

      await expect(
        service.findTeamAll(OWNER_ID, TEAM_ID, {
          ...defaultQuery,
          cursor,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it("should rethrow unexpected errors", async () => {
      const error = new Error("db down");
      prisma.unavailability.findMany.mockRejectedValue(error);

      await expect(
        service.findTeamAll(OWNER_ID, TEAM_ID, defaultQuery)
      ).rejects.toThrow(error);
    });
  });

  describe("findPending", () => {
    const defaultQuery = {
      limit: 20,
      offset: 0,
      sortField: SORT_FIELD.CREATED_AT,
      sortOrder: SORT_ORDER.ASC,
    };

    it("should return pending unavailabilities with a total count", async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());

      const pending = [makeUnavailability({ confirmed: false })];

      prisma.unavailability.findMany.mockResolvedValue(pending);
      prisma.unavailability.count.mockResolvedValue(1);

      const result = await service.findPending(OWNER_ID, TEAM_ID, defaultQuery);

      expect(result).toEqual({ unavailabilities: pending, total: 1 });

      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            confirmed: false,
            teamMember: {
              teamId: TEAM_ID,
              team: { ownerId: OWNER_ID },
            },
          },
          skip: 0,
          take: 20,
          orderBy: { createdAt: SORT_ORDER.ASC },
        })
      );
      expect(prisma.unavailability.count).toHaveBeenCalledTimes(1);
    });
  });

  describe("findMemberAll", () => {
    const defaultQuery = {
      limit: 20,
      offset: 0,
      sortField: SORT_FIELD.CREATED_AT,
      sortOrder: SORT_ORDER.ASC,
    };

    it("should return a member's unavailabilities with a total count", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());

      const memberUnavailabilities = [makeUnavailability()];

      prisma.unavailability.findMany.mockResolvedValue(memberUnavailabilities);
      prisma.unavailability.count.mockResolvedValue(1);

      const result = await service.findMemberAll(
        OWNER_ID,
        TEAM_ID,
        MEMBER_ID,
        defaultQuery
      );

      expect(result).toEqual({
        unavailabilities: memberUnavailabilities,
        total: 1,
      });

      expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { memberId: MEMBER_ID },
          skip: 0,
          take: 20,
        })
      );
    });
  });

  describe("removeMemberAll", () => {
    it("should delete all of a member's unavailabilities", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.deleteMany.mockResolvedValue({ count: 2 });

      await service.removeMemberAll(OWNER_ID, TEAM_ID, MEMBER_ID);

      expect(prisma.unavailability.deleteMany).toHaveBeenCalledWith({
        where: { memberId: MEMBER_ID },
      });
    });

    it("should throw ForbiddenException when the requester is not authorized", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());

      await expect(
        service.removeMemberAll("notTheOwner", TEAM_ID, MEMBER_ID)
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.unavailability.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("removeMemberOne", () => {
    it("should delete a single unavailability", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());

      await service.removeMemberOne(
        OWNER_ID,
        TEAM_ID,
        MEMBER_ID,
        UNAVAILABILITY_ID
      );

      expect(prisma.unavailability.delete).toHaveBeenCalledWith({
        where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
      });
    });

    it("should throw NotFoundException when the unavailability doesn't exist", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.delete.mockRejectedValue(
        new PrismaClientKnownRequestError("does not exist", {
          code: "P2025",
          clientVersion: "5.0.0",
        })
      );

      await expect(
        service.removeMemberOne(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update reason without touching confirmation for an ordinary member", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.findUnique.mockResolvedValue(makeUnavailability());

      const updated = makeUnavailability({ reason: "family" });

      prisma.unavailability.update.mockResolvedValue(updated);

      const result = await service.update(
        "userId",
        TEAM_ID,
        MEMBER_ID,
        UNAVAILABILITY_ID,
        { reason: "family" }
      );

      expect(result).toEqual(updated);

      expect(prisma.unavailability.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
          data: expect.objectContaining({
            confirmed: false, // unchanged (no date change, requester not owner)
          }),
        })
      );
    });

    it("should mark as confirmed when the requester is the team owner", async () => {
      // requester is the owner
      prisma.teamMember.findUnique.mockResolvedValue(
        makeTeamMember({ userId: OWNER_ID })
      );
      prisma.unavailability.findUnique.mockResolvedValue(makeUnavailability());

      const updated = makeUnavailability({ confirmed: true });

      prisma.unavailability.update.mockResolvedValue(updated);

      await service.update(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
        reason: "family",
      });

      expect(prisma.unavailability.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ confirmed: true }),
        })
      );
    });

    it("should throw BadRequestException when the unavailability does not exist", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.findUnique.mockResolvedValue(null);

      await expect(
        service.update(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
          reason: "family",
        })
      ).rejects.toThrow(NotFoundException);
    });

    it("should convert dates to UTC and keep them within the existing window", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.findUnique.mockResolvedValue(makeUnavailability());

      prisma.unavailability.update.mockResolvedValue(
        makeUnavailability({ startDate: NOW_DATE })
      );

      const startDate = new Date("2026-01-15T12:00:00.000Z");
      await service.update(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
        startDate,
        timezone: "America/New_York",
      });

      const expectedStart = convertDateToUtc(startDate, "America/New_York");
      expect(prisma.unavailability.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startDate: expectedStart }),
        })
      );
    });
  });

  describe("confirm", () => {
    it("should confirm a pending unavailability", async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.findUnique.mockResolvedValue(
        makeUnavailability({ confirmed: false })
      );

      await service.confirm(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID);

      expect(prisma.unavailability.update).toHaveBeenCalledWith({
        where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
        data: { confirmed: true },
      });
    });

    it("should throw BadRequestException when the unavailability is already confirmed", async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
      prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
      prisma.unavailability.findUnique.mockResolvedValue(
        makeUnavailability({ confirmed: true })
      );

      await expect(
        service.confirm(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(BadRequestException);

      expect(prisma.unavailability.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the member doesn't exist", async () => {
      prisma.team.findUnique.mockResolvedValue(makeTeam());
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.confirm(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
      ).rejects.toThrow(NotFoundException);

      expect(prisma.unavailability.update).not.toHaveBeenCalled();
    });
  });
});
