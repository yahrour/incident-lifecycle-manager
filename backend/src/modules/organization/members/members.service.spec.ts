/* eslint-disable @typescript-eslint/no-unsafe-assignment */

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

const prismaError = (code: string) =>
  new PrismaClientKnownRequestError(code, { code, clientVersion: "5.0.0" });

const makeTeam = (overrides = {}) => ({
  id: TEAM_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: "frontend",
  ownerId: OWNER_ID,
  description: null,
  services: [],
  rotationPeriodDays: 7,
  rotationStartDate: new Date(),
  currentRotationIndex: 0,
  lastRotatedAt: new Date(),
  escalationTimeoutMinutes: 30,
  ...overrides,
});

const makeMembers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    teamId: TEAM_ID,
    joinedAt: new Date(),
  }));

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

  describe("addToTeam", () => {
    let tx: DeepMockProxy<Prisma.TransactionClient>;

    beforeEach(() => {
      tx = mockDeep<Prisma.TransactionClient>();
    });

    it("throws NotFoundException when the team doesn't exist", async () => {
      tx.team.findUnique.mockResolvedValue(null);

      await expect(service.addToTeam(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        NotFoundException
      );
      expect(tx.teamMember.create).not.toHaveBeenCalled();
    });

    it("throws ConflictException when the user owns the team", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam({ ownerId: USER_ID }));

      await expect(service.addToTeam(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        ConflictException
      );
      expect(tx.teamMember.create).not.toHaveBeenCalled();
    });

    it("adds the user to the team", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());

      await expect(
        service.addToTeam(tx, TEAM_ID, USER_ID)
      ).resolves.toBeUndefined();

      expect(tx.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID },
      });
      expect(tx.teamMember.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, teamId: TEAM_ID },
      });
    });

    it("throws ConflictException when the user already belongs to a team (P2002)", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());
      tx.teamMember.create.mockRejectedValue(prismaError("P2002"));

      await expect(service.addToTeam(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        ConflictException
      );
    });

    it("throws NotFoundException when the user doesn't exist (P2003)", async () => {
      tx.team.findUnique.mockResolvedValue(makeTeam());
      tx.teamMember.create.mockRejectedValue(prismaError("P2003"));

      await expect(service.addToTeam(tx, TEAM_ID, USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("rethrows unknown errors", async () => {
      const error = new Error("boom");
      tx.team.findUnique.mockResolvedValue(makeTeam());
      tx.teamMember.create.mockRejectedValue(error);

      await expect(service.addToTeam(tx, TEAM_ID, USER_ID)).rejects.toBe(error);
    });
  });

  describe("findByTeam", () => {
    const scope = { teamId: TEAM_ID, team: { ownerId: OWNER_ID } };

    it("returns the members and total, scoped to the owner's team", async () => {
      const members = makeMembers(3);
      prisma.teamMember.findMany.mockResolvedValue(members as never);
      prisma.teamMember.count.mockResolvedValue(3);

      const result = await service.findByTeam(OWNER_ID, TEAM_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({ members, total: 3 });
      expect(prisma.teamMember.count).toHaveBeenCalledWith({ where: scope });
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0, where: scope })
      );
    });

    it("returns an empty list when the team has no members", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      const result = await service.findByTeam(OWNER_ID, TEAM_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({ members: [], total: 0 });
    });

    it("forwards limit and offset to take and skip", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      await service.findByTeam(OWNER_ID, TEAM_ID, { limit: 20, offset: 10 });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 10 })
      );
    });

    it("sorts by the requested field with id as a tiebreaker", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      await service.findByTeam(OWNER_ID, TEAM_ID, {
        limit: 10,
        offset: 0,
        sortField: SORT_FIELD.JOINED_AT,
        sortOrder: SORT_ORDER.DESC,
      });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ joinedAt: SORT_ORDER.DESC }, { id: SORT_ORDER.DESC }],
        })
      );
    });

    it("omits orderBy when no sortField is given", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      await service.findByTeam(OWNER_ID, TEAM_ID, { limit: 10, offset: 0 });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ orderBy: expect.anything() })
      );
    });

    it("includes only currently active, approved unavailabilities", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      await service.findByTeam(OWNER_ID, TEAM_ID, { limit: 10, offset: 0 });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            unavailabilities: {
              where: {
                status: "APPROVED",
                startDate: { lte: expect.any(Date) },
                endDate: { gte: expect.any(Date) },
              },
            },
          }),
        })
      );
    });
  });

  describe("findAllForOwner", () => {
    const scope = { team: { ownerId: OWNER_ID } };

    it("returns members across all of the owner's teams", async () => {
      const members = makeMembers(2);
      prisma.teamMember.findMany.mockResolvedValue(members as never);
      prisma.teamMember.count.mockResolvedValue(2);

      const result = await service.findAllForOwner(OWNER_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({ members, total: 2 });
      expect(prisma.teamMember.count).toHaveBeenCalledWith({ where: scope });
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0, where: scope })
      );
    });

    it("includes the team's id and name", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      await service.findAllForOwner(OWNER_ID, { limit: 10, offset: 0 });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            team: { select: { id: true, name: true } },
          }),
        })
      );
    });

    it("sorts with id as a tiebreaker", async () => {
      prisma.teamMember.findMany.mockResolvedValue([]);
      prisma.teamMember.count.mockResolvedValue(0);

      await service.findAllForOwner(OWNER_ID, {
        limit: 10,
        offset: 0,
        sortField: SORT_FIELD.JOINED_AT,
        sortOrder: SORT_ORDER.ASC,
      });

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ joinedAt: SORT_ORDER.ASC }, { id: SORT_ORDER.ASC }],
        })
      );
    });
  });

  describe("removeFromTeam", () => {
    let tx: DeepMockProxy<Prisma.TransactionClient>;

    // members with ids 1..4, in joinedAt order
    const mockTeam = (currentRotationIndex: number) =>
      tx.team.findUnique.mockResolvedValue({
        currentRotationIndex,
        teamMembers: makeMembers(4).map(({ id }) => ({ id })),
      } as never);

    beforeEach(() => {
      tx = mockDeep<Prisma.TransactionClient>();
      prisma.$transaction.mockImplementation(
        (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) => fn(tx)
      );
    });

    it("looks up the team scoped to the owner, in rotation order", async () => {
      mockTeam(0);

      await expect(
        service.removeFromTeam(OWNER_ID, TEAM_ID, 1)
      ).resolves.toBeUndefined();

      expect(tx.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID, ownerId: OWNER_ID },
        select: {
          currentRotationIndex: true,
          teamMembers: { orderBy: { joinedAt: "asc" }, select: { id: true } },
        },
      });
      expect(tx.teamMember.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("throws NotFoundException when the team doesn't exist or isn't owned", async () => {
      tx.team.findUnique.mockResolvedValue(null);

      await expect(
        service.removeFromTeam(OWNER_ID, TEAM_ID, MEMBER_ID)
      ).rejects.toThrow(NotFoundException);
      expect(tx.teamMember.delete).not.toHaveBeenCalled();
      expect(tx.team.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the member isn't in the team, without touching the index", async () => {
      mockTeam(0);

      await expect(
        service.removeFromTeam(OWNER_ID, TEAM_ID, 99)
      ).rejects.toThrow(NotFoundException);
      expect(tx.teamMember.delete).not.toHaveBeenCalled();
      expect(tx.team.update).not.toHaveBeenCalled();
    });

    it("decrements the rotation index when the removed member is before the on-call one", async () => {
      // on-call is position 2 (id 3); removing position 0 (id 1)
      mockTeam(2);

      await service.removeFromTeam(OWNER_ID, TEAM_ID, 1);

      expect(tx.team.update).toHaveBeenCalledWith({
        where: { id: TEAM_ID },
        data: { currentRotationIndex: { decrement: 1 } },
      });
    });

    it.each([
      ["the on-call member", 3],
      ["a member after the on-call one", 4],
    ])("keeps the rotation index when removing %s", async (_, memberId) => {
      mockTeam(2);

      await service.removeFromTeam(OWNER_ID, TEAM_ID, memberId);

      expect(tx.teamMember.delete).toHaveBeenCalledWith({
        where: { id: memberId },
      });
      expect(tx.team.update).not.toHaveBeenCalled();
    });

    it("rethrows delete errors without updating the index", async () => {
      const error = new Error("boom");
      mockTeam(2);
      tx.teamMember.delete.mockRejectedValue(error);

      await expect(service.removeFromTeam(OWNER_ID, TEAM_ID, 1)).rejects.toBe(
        error
      );
      expect(tx.team.update).not.toHaveBeenCalled();
    });
  });

  describe("isInTeam", () => {
    it("returns true when the user has a membership", async () => {
      prisma.teamMember.findUnique.mockResolvedValue({ id: 1 } as never);

      await expect(service.isInTeam(USER_ID)).resolves.toBe(true);
      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        select: { id: true },
      });
    });

    it("returns false when the user has no membership", async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.isInTeam(USER_ID)).resolves.toBe(false);
    });
  });
});
