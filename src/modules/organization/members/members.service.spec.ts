import { Test } from "@nestjs/testing";
import { MembersService } from "./members.service";
import { PrismaService } from "@/common/prisma/prisma.service";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Prisma } from "@/generated/prisma/client";

describe("MembersService", () => {
  let service: MembersService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(MembersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("add", () => {
    let tx: DeepMockProxy<Prisma.TransactionClient>;

    beforeEach(() => {
      tx = mockDeep<Prisma.TransactionClient>();
    });

    it("should throw a NotFoundException", async () => {
      tx.team.findUnique.mockResolvedValue(null);

      const result = service.add(tx, "teamId", "userId");

      await expect(result).rejects.toThrow(NotFoundException);
    });

    it("should throw a ConflictException", async () => {
      const userId = "447e2153-0c44-44bc-89b0-111111111111";
      const team = {
        id: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        createdAt: new Date(),
        name: "frontend",
        ownerId: userId,
        description: null,
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        escalationTimeoutMinutes: 30,
        updatedAt: new Date(),
      };
      tx.team.findUnique.mockResolvedValue(team);

      const result = service.add(tx, "teamId", userId);

      await expect(result).rejects.toThrow(ConflictException);
    });

    it("should add member to a team", async () => {
      const team = {
        id: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        createdAt: new Date(),
        name: "frontend",
        ownerId: "447e2153-0c44-44bc-89b0-111111111111",
        description: null,
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        escalationTimeoutMinutes: 30,
        updatedAt: new Date(),
      };
      tx.team.findUnique.mockResolvedValue(team);

      const result = await service.add(tx, "teamId", "userId");

      expect(result).toBeUndefined();
    });

    it("throw ConflictException", async () => {
      const team = {
        id: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        createdAt: new Date(),
        name: "frontend",
        ownerId: "447e2153-0c44-44bc-89b0-111111111111",
        description: null,
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        escalationTimeoutMinutes: 30,
        updatedAt: new Date(),
      };
      tx.team.findUnique.mockResolvedValue(team);
      tx.teamMember.create.mockRejectedValue(
        new PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.add(tx, "teamId", "userId")).rejects.toThrow(
        ConflictException
      );
    });

    it("throw NotFoundException", async () => {
      const team = {
        id: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        createdAt: new Date(),
        name: "frontend",
        ownerId: "447e2153-0c44-44bc-89b0-111111111111",
        description: null,
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        escalationTimeoutMinutes: 30,
        updatedAt: new Date(),
      };
      tx.team.findUnique.mockResolvedValue(team);
      tx.teamMember.create.mockRejectedValue(
        new PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2003",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.add(tx, "teamId", "userId")).rejects.toThrow(
        NotFoundException
      );
    });

    it("rethrows unknown errors", async () => {
      const team = {
        id: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        createdAt: new Date(),
        name: "frontend",
        ownerId: "447e2153-0c44-44bc-89b0-111111111111",
        description: null,
        rotationPeriodDays: 7,
        rotationStartDate: new Date(),
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
        escalationTimeoutMinutes: 30,
        updatedAt: new Date(),
      };
      tx.team.findUnique.mockResolvedValue(team);
      const unknownError = new Error("unknown error");
      tx.teamMember.create.mockRejectedValue(unknownError);

      await expect(service.add(tx, "teamId", "userId")).rejects.toThrow(
        unknownError
      );
    });
  });

  describe("findAll", () => {
    it("should return all members and the total count", async () => {
      const members = [
        {
          id: 1,
          userId: "447e2153-0c44-44bc-89b0-111111111111",
          teamId: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
          joinedAt: new Date(),
        },
        {
          id: 1,
          userId: "447e2153-0c44-44bc-89b0-222222222222",
          teamId: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
          joinedAt: new Date(),
        },
        {
          id: 1,
          userId: "447e2153-0c44-44bc-89b0-333333333333",
          teamId: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
          joinedAt: new Date(),
        },
      ];
      prisma.teamMember.findMany.mockResolvedValue(members);
      prisma.teamMember.count.mockResolvedValue(3);

      const result = await service.findAll("teamId", "ownerId", {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        members,
        total: 3,
      });
    });
  });

  describe("findOne", () => {
    it("should return a member", async () => {
      const member = {
        id: 1,
        userId: "447e2153-0c44-44bc-89b0-111111111111",
        teamId: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        joinedAt: new Date(),
      };
      prisma.teamMember.findUnique.mockResolvedValue(member);

      const result = await service.findOne("teamId", 1, "ownerId");

      expect(result).toEqual(member);
    });

    it("should throw a NotFoundException", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne("teamId", 1, "ownerId")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("remove", () => {
    it("should remove a member", async () => {
      const member = {
        id: 1,
        userId: "447e2153-0c44-44bc-89b0-111111111111",
        teamId: "447e2153-0c44-44bc-89b0-zzzzzzzzzzzz",
        joinedAt: new Date(),
      };
      prisma.teamMember.delete.mockResolvedValue(member);

      const result = await service.remove("teamId", 1, "ownerId");

      expect(result).toBeUndefined();
    });

    it("should throw a NotFoundException", async () => {
      prisma.teamMember.delete.mockRejectedValue(
        new PrismaClientKnownRequestError("Record not found", {
          code: "P2025",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.remove("teamId", 1, "ownerId")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw an unknown error", async () => {
      const unknownError = new Error("unknown error");
      prisma.teamMember.delete.mockRejectedValue(unknownError);

      await expect(service.remove("teamId", 1, "ownerId")).rejects.toThrow(
        unknownError
      );
    });
  });
});
