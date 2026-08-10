/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test } from "@nestjs/testing";
import { PrismaService } from "@/common/prisma/prisma.service";
import { TeamsService } from "./teams.service";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { convertDateToUtc } from "@/common/utils/timezone";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { ConflictException, NotFoundException } from "@nestjs/common";

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

  // TODO: findAll
});
