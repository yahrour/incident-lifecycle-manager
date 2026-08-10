/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test } from "@nestjs/testing";
import { PrismaService } from "@/common/prisma/prisma.service";
import { TeamsService } from "./teams.service";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { convertDateToUtc } from "@/common/utils/timezone";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { SORT_FIELD } from "./constants";
import { SORT_ORDER } from "@/common/constants";

const encodeCursor = (cursor: {
  id: string;
  sortField: SORT_FIELD;
  sortOrder: SORT_ORDER;
}) => Buffer.from(JSON.stringify(cursor)).toString("base64url");

const TEAM_ID = "teamId";
const OWNER_ID = "ownerId";
const NOW_DATE = new Date("2026-01-15T00:00:00.000Z");

describe("TeamsService", () => {
  let service: TeamsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW_DATE);

    prisma = createMockPrisma();

    const module = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a team", async () => {
      const createTeamDto = {
        name: "frontend",
        description: "this team is responsible for the application frontend",
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        timezone: "UTC",
        escalationTimeoutMinutes: 30,
      };

      const team = {
        id: TEAM_ID,
        ownerId: OWNER_ID,
        name: createTeamDto.name,
        description: createTeamDto.description,
        rotationPeriodDays: createTeamDto.rotationPeriodDays,
        rotationStartDate: createTeamDto.rotationStartDate,
        escalationTimeoutMinutes: createTeamDto.escalationTimeoutMinutes,
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.team.create.mockResolvedValue(team);

      const result = await service.create(OWNER_ID, createTeamDto);

      expect(result).toEqual(team);

      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            ownerId: OWNER_ID,
            name: createTeamDto.name,
            description: createTeamDto.description,
            rotationPeriodDays: createTeamDto.rotationPeriodDays,
            rotationStartDate: convertDateToUtc(
              createTeamDto.rotationStartDate,
              createTeamDto.timezone
            ),
            escalationTimeoutMinutes: createTeamDto.escalationTimeoutMinutes,
          },
        })
      );
    });

    it("should throw ConflictException because team already exists", async () => {
      const createTeamDto = {
        name: "frontend",
        description: "this team is responsible for the application frontend",
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        timezone: "UTC",
        escalationTimeoutMinutes: 30,
      };

      prisma.team.create.mockRejectedValue(
        new PrismaClientKnownRequestError("Team already exists", {
          code: "P2002",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.create(OWNER_ID, createTeamDto)).rejects.toThrow(
        ConflictException
      );
    });

    it("should rethrow unknown errors", async () => {
      const createTeamDto = {
        name: "frontend",
        description: "this team is responsible for the application frontend",
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        timezone: "UTC",
        escalationTimeoutMinutes: 30,
      };
      const error = new Error("unknow error");

      prisma.team.create.mockRejectedValue(error);

      await expect(service.create(OWNER_ID, createTeamDto)).rejects.toThrow(
        error
      );
    });
  });

  describe("update", () => {
    it("should update a team", async () => {
      const updateTeamDto = {
        name: "backend",
        description: "this team is responsible for the backend",
        escalationTimeoutMinutes: 60,
      };

      const updatedTeam = {
        id: TEAM_ID,
        ownerId: OWNER_ID,
        name: updateTeamDto.name,
        description: updateTeamDto.description,
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        escalationTimeoutMinutes: updateTeamDto.escalationTimeoutMinutes,
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.team.update.mockResolvedValue(updatedTeam);

      const result = await service.update(TEAM_ID, OWNER_ID, updateTeamDto);

      expect(result).toEqual(updatedTeam);

      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: TEAM_ID,
            ownerId: OWNER_ID,
          },
          data: {
            ...updateTeamDto,
            currentRotationIndex: undefined,
            lastRotatedAt: undefined,
          },
        })
      );
    });

    it("should reset rotation when rotationPeriodDays is updated", async () => {
      const updateTeamDto = {
        rotationPeriodDays: 14,
      };

      const updatedTeam = {
        id: TEAM_ID,
        ownerId: OWNER_ID,
        name: "frontend",
        description: "frontend team",
        rotationPeriodDays: 14,
        rotationStartDate: NOW_DATE,
        escalationTimeoutMinutes: 30,
        currentRotationIndex: 0,
        lastRotatedAt: NOW_DATE,
        createdAt: NOW_DATE,
        updatedAt: NOW_DATE,
      };

      prisma.team.update.mockResolvedValue(updatedTeam);

      const result = await service.update(TEAM_ID, OWNER_ID, updateTeamDto);

      expect(result).toEqual(updatedTeam);

      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: TEAM_ID,
            ownerId: OWNER_ID,
          },
          data: expect.objectContaining({
            rotationPeriodDays: 14,
            currentRotationIndex: 0,
            lastRotatedAt: NOW_DATE,
          }),
        })
      );
    });

    it("should throw NotFoundException when team does not exist", async () => {
      prisma.team.update.mockRejectedValue(
        new PrismaClientKnownRequestError("Team does not exist", {
          code: "P2025",
          clientVersion: "5.0.0",
        })
      );

      await expect(
        service.update(TEAM_ID, OWNER_ID, {
          name: "backend",
        })
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when team name already exists", async () => {
      prisma.team.update.mockRejectedValue(
        new PrismaClientKnownRequestError("Team already exists", {
          code: "P2002",
          clientVersion: "5.0.0",
        })
      );

      await expect(
        service.update(TEAM_ID, OWNER_ID, {
          name: "backend",
        })
      ).rejects.toThrow(ConflictException);
    });

    it("should rethrow unknown errors", async () => {
      const error = new Error("unknow error");

      prisma.team.update.mockRejectedValue(error);

      await expect(
        service.update(TEAM_ID, OWNER_ID, {
          name: "backend",
        })
      ).rejects.toThrow(error);
    });
  });

  describe("findOne", () => {
    it("should return a team", async () => {
      const team = {
        id: TEAM_ID,
        ownerId: OWNER_ID,
        name: "frontend",
        description: "this team is responsible for the application frontend",
        rotationPeriodDays: 7,
        rotationStartDate: NOW_DATE,
        timezone: "UTC",
        escalationTimeoutMinutes: 30,
        currentRotationIndex: 0,
        lastRotatedAt: NOW_DATE,
        createdAt: NOW_DATE,
        updatedAt: NOW_DATE,
      };

      prisma.team.findUnique.mockResolvedValue(team);

      const result = await service.findOne(TEAM_ID, OWNER_ID);

      expect(result).toEqual(team);

      expect(prisma.team.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: TEAM_ID,
            ownerId: OWNER_ID,
          },
        })
      );
    });

    it("should throw NotFoundException when team does not exist", async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.findOne(TEAM_ID, OWNER_ID)).rejects.toThrow(
        NotFoundException
      );

      expect(prisma.team.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: TEAM_ID,
            ownerId: OWNER_ID,
          },
        })
      );
    });
  });

  describe("delete", () => {
    it("should delete a team", async () => {
      const team = {
        id: TEAM_ID,
        ownerId: OWNER_ID,
        name: "frontend",
        description: "this team is responsible for the application frontend",
        rotationPeriodDays: 7,
        rotationStartDate: NOW_DATE,
        timezone: "UTC",
        escalationTimeoutMinutes: 30,
        currentRotationIndex: 0,
        lastRotatedAt: NOW_DATE,
        createdAt: NOW_DATE,
        updatedAt: NOW_DATE,
      };
      prisma.team.delete.mockResolvedValue(team);

      await service.delete(TEAM_ID, OWNER_ID);

      expect(prisma.team.delete).toHaveBeenCalledWith({
        where: {
          id: TEAM_ID,
          ownerId: OWNER_ID,
        },
      });
    });

    it("should throw NotFoundException when team doesn't exist", async () => {
      prisma.team.delete.mockRejectedValue(
        new PrismaClientKnownRequestError("Team doesn't exist", {
          code: "P2025",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.delete(TEAM_ID, OWNER_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAll", () => {
    const defaultQuery = {
      limit: 20,
      sortField: SORT_FIELD.CREATED_AT,
      sortOrder: SORT_ORDER.ASC,
    };

    const makeTeam = (index: number) => ({
      id: `${TEAM_ID}${index}`,
      name: `frontend-${index}`,
      description: "frontend team",
      rotationPeriodDays: 7,
      rotationStartDate: NOW_DATE,
      escalationTimeoutMinutes: 30,
      currentRotationIndex: 0,
      lastRotatedAt: NOW_DATE,
      createdAt: NOW_DATE,
    });

    it("should return teams scoped to the owner without a next cursor when there is no next page", async () => {
      const teams = [makeTeam(1), makeTeam(2)];
      prisma.team.findMany.mockResolvedValue(teams);

      const result = await service.findAll(OWNER_ID, defaultQuery);

      expect(result).toEqual({ teams, nextCursor: null });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: OWNER_ID },
          take: defaultQuery.limit + 1,
          orderBy: [
            { [defaultQuery.sortField]: defaultQuery.sortOrder },
            { id: defaultQuery.sortOrder },
          ],
        })
      );
    });

    it("should return an empty list and no next cursor when there are no teams", async () => {
      prisma.team.findMany.mockResolvedValue([]);

      const result = await service.findAll(OWNER_ID, defaultQuery);

      expect(result).toEqual({ teams: [], nextCursor: null });
    });

    it("should return a next cursor when there are more pages and truncate the results to the limit", async () => {
      const teams = [makeTeam(1), makeTeam(2), makeTeam(3)];
      prisma.team.findMany.mockResolvedValue(teams);

      const result = await service.findAll(OWNER_ID, {
        ...defaultQuery,
        limit: 2,
      });

      expect(result.teams).toEqual([makeTeam(1), makeTeam(2)]);

      const decodedCursor = result.nextCursor
        ? JSON.parse(
            Buffer.from(result.nextCursor, "base64url").toString("utf-8")
          )
        : null;
      expect(decodedCursor).toEqual({
        id: makeTeam(2).id,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });
    });

    it("should filter by search using a case-insensitive name match", async () => {
      const teams = [makeTeam(1)];
      prisma.team.findMany.mockResolvedValue(teams);

      const search = "frontend";
      const result = await service.findAll(OWNER_ID, {
        ...defaultQuery,
        search,
      });

      expect(result).toEqual({ teams, nextCursor: null });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ownerId: OWNER_ID,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        })
      );
    });

    it("should skip the cursor record when a cursor is provided", async () => {
      const cursorId = "6015a4a0-b9ea-4a4d-85e1-5f0b4c8d0e2f";
      const cursor = encodeCursor({
        id: cursorId,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });
      prisma.team.findMany.mockResolvedValue([makeTeam(2)]);

      await service.findAll(OWNER_ID, { ...defaultQuery, cursor });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: { id: cursorId },
        })
      );
    });

    it("should combine cursor pagination with truncation and produce the next cursor when a page follows", async () => {
      const cursorId = "6015a4a0-b9ea-4a4d-85e1-5f0b4c8d0e2f";
      const cursor = encodeCursor({
        id: cursorId,
        sortField: defaultQuery.sortField,
        sortOrder: defaultQuery.sortOrder,
      });

      // 3 rows returned from Prisma (2 fit the page, 1 signals a next page)
      prisma.team.findMany.mockResolvedValue([
        makeTeam(1),
        makeTeam(2),
        makeTeam(3),
      ]);

      const result = await service.findAll(OWNER_ID, {
        ...defaultQuery,
        cursor,
        limit: 2,
      });

      expect(result.teams).toEqual([makeTeam(1), makeTeam(2)]);

      const decodedCursor = result.nextCursor
        ? JSON.parse(
            Buffer.from(result.nextCursor, "base64url").toString("utf-8")
          )
        : null;
      expect(decodedCursor).toEqual({
        id: makeTeam(2).id,
        sortField: SORT_FIELD.CREATED_AT,
        sortOrder: SORT_ORDER.ASC,
      });
    });

    it("should throw BadRequestException when the cursor sort parameters do not match the query", async () => {
      const cursor = encodeCursor({
        id: "6015a4a0-b9ea-4a4d-85e1-5f0b4c8d0e2f",
        sortField: SORT_FIELD.NAME,
        sortOrder: defaultQuery.sortOrder,
      });

      await expect(
        service.findAll(OWNER_ID, { ...defaultQuery, cursor })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.team.findMany).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when the cursor is invalid", async () => {
      await expect(
        service.findAll(OWNER_ID, {
          ...defaultQuery,
          cursor: "not-a-valid-cursor",
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.team.findMany).not.toHaveBeenCalled();
    });
  });
});
