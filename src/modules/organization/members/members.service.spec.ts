import { Test } from "@nestjs/testing";
import { MembersService } from "./members.service";
import { PrismaService } from "@/common/prisma/prisma.service";
import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Prisma } from "@/generated/prisma/client";
import { SORT_FIELD } from "./constants";
import { SORT_ORDER } from "@/common/constants";

const TEAM_ID = "teamId";
const USER_ID = "userId";
const OWNER_ID = "ownerId";
const MEMBER_ID = 1;

const makeTeam = (overrides = {}) => ({
  id: TEAM_ID,
  createdAt: new Date(),
  name: "frontend",
  ownerId: OWNER_ID,
  description: null,
  rotationPeriodDays: 7,
  rotationStartDate: new Date(),
  currentRotationIndex: 0,
  lastRotatedAt: new Date(),
  escalationTimeoutMinutes: 30,
  updatedAt: new Date(),
  ...overrides,
});

const makeMembers = (n: number) => {
  type Member = {
    id: number;
    userId: string;
    teamId: string;
    joinedAt: Date;
  };
  const members: Member[] = [];

  for (let i = 1; i <= n; i++) {
    members.push({
      id: i,
      userId: `user-${i}`,
      teamId: TEAM_ID,
      joinedAt: new Date(),
    });
  }

  return members;
};

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

    it("should throw a NotFoundException when team doesn't exist", async () => {
      tx.team.findUnique.mockResolvedValue(null);

      const result = service.add(tx, TEAM_ID, USER_ID);

      await expect(result).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when user is the team owner", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam({ ownerId: USER_ID }));

      const result = service.add(tx, TEAM_ID, USER_ID);

      await expect(result).rejects.toThrow(ConflictException);
    });

    it("should add member to a team", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());

      const result = await service.add(tx, TEAM_ID, USER_ID);

      expect(tx.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID },
      });
      expect(tx.teamMember.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          teamId: TEAM_ID,
        },
      });

      expect(result).toBeUndefined();
    });

    it("should throw ConflictException on unique constraint violation (user already a member of a team)", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());
      tx.teamMember.create.mockRejectedValue(
        new PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.add(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw NotFoundException when user doesn't exist", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());
      tx.teamMember.create.mockRejectedValue(
        new PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2003",
          clientVersion: "5.0.0",
        })
      );

      await expect(service.add(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should rethrow unknown errors", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());
      const unknownError = new Error("unknown error");
      tx.teamMember.create.mockRejectedValue(unknownError);

      await expect(service.add(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        unknownError
      );
    });
  });

  describe("findAll", () => {
    it("should return all members and the total count", async () => {
      const members = makeMembers(3);
      prisma.teamMember.findMany.mockResolvedValue(members);
      prisma.teamMember.count.mockResolvedValue(3);

      const result = await service.findAll(TEAM_ID, OWNER_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        members,
        total: 3,
      });

      expect(prisma.teamMember.count).toHaveBeenCalledWith({
        where: {
          teamId: TEAM_ID,
          team: {
            ownerId: OWNER_ID,
          },
        },
      });
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          where: {
            teamId: TEAM_ID,
            team: {
              ownerId: OWNER_ID,
            },
          },
        })
      );
    });

    it("should return an empty list when the team has no members", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      const result = await service.findAll(TEAM_ID, OWNER_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        members: [],
        total: 0,
      });
    });

    it("forwards limit/offset to take/skip", async () => {
      const members = makeMembers(3);
      prisma.teamMember.findMany.mockResolvedValue(members);
      prisma.teamMember.count.mockResolvedValue(3);

      const result = await service.findAll(TEAM_ID, OWNER_ID, {
        limit: 20,
        offset: 10,
      });

      expect(result).toEqual({
        members,
        total: 3,
      });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 10,
          where: {
            teamId: TEAM_ID,
            team: {
              ownerId: OWNER_ID,
            },
          },
        })
      );
    });

    it("forwards sortField/sortOrder to orderBy", async () => {
      const members = makeMembers(3);
      prisma.teamMember.findMany.mockResolvedValue(members);
      prisma.teamMember.count.mockResolvedValue(3);

      const result = await service.findAll(TEAM_ID, OWNER_ID, {
        limit: 10,
        offset: 0,
        sortField: SORT_FIELD.JOINED_AT,
        sortOrder: SORT_ORDER.DESC,
      });

      expect(result).toEqual({
        members,
        total: 3,
      });
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          orderBy: {
            joinedAt: SORT_ORDER.DESC,
          },
          where: {
            teamId: TEAM_ID,
            team: {
              ownerId: OWNER_ID,
            },
          },
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return a member", async () => {
      const member = makeMembers(1)[0];
      prisma.teamMember.findUnique.mockResolvedValue(member);

      const result = await service.findOne(TEAM_ID, member.id, OWNER_ID);

      expect(result).toEqual(member);

      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: member.id,
            teamId: TEAM_ID,
            team: {
              ownerId: OWNER_ID,
            },
          },
        })
      );
    });

    it("should throw a NotFoundException when member doesn't exist", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(TEAM_ID, MEMBER_ID, OWNER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove a member", async () => {
      const member = makeMembers(1)[0];
      prisma.teamMember.delete.mockResolvedValue(member);

      const result = await service.remove(TEAM_ID, member.id, OWNER_ID);

      expect(result).toBeUndefined();

      expect(prisma.teamMember.delete).toHaveBeenCalledWith({
        where: {
          id: member.id,
          teamId: TEAM_ID,
          team: {
            ownerId: OWNER_ID,
          },
        },
      });
    });

    it("should throw a NotFoundException when member doesn't exist", async () => {
      prisma.teamMember.delete.mockRejectedValue(
        new PrismaClientKnownRequestError("Record not found", {
          code: "P2025",
          clientVersion: "5.0.0",
        })
      );

      await expect(
        service.remove(TEAM_ID, MEMBER_ID, OWNER_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it("should rethrow an unknown error", async () => {
      const unknownError = new Error("unknown error");
      prisma.teamMember.delete.mockRejectedValue(unknownError);

      await expect(
        service.remove(TEAM_ID, MEMBER_ID, OWNER_ID)
      ).rejects.toThrow(unknownError);
    });
  });
});
