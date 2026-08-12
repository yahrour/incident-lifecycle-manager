jest.mock("src/common/prisma/prisma.service", () => ({
  PrismaService: class {},
}));
jest.mock("src/modules/oncall/oncall.service", () => ({
  OnCallService: class {},
}));

import { IncidentsService } from "./incidents.service";
import { ConflictException } from "@nestjs/common";
import type { PrismaService } from "src/common/prisma/prisma.service";
import type { OnCallService } from "src/modules/oncall/oncall.service";

describe("IncidentsService", () => {
  const incident = {
    teamId: "22222222-2222-4222-8222-222222222222",
    title: "API errors",
    service: "api",
    severity: "high" as const,
  };

  it("assigns a new incident to the primary on-call engineer", async () => {
    const create = jest.fn();
    const prisma = { incident: { create } } as unknown as PrismaService;
    const getCurrentOnCall = jest.fn().mockResolvedValue({
      chain: [{ role: "PRIMARY", id: "11111111-1111-4111-8111-111111111111" }],
    });
    const onCall = { getCurrentOnCall } as unknown as OnCallService;
    const service = new IncidentsService(prisma, onCall);

    await service.create("owner-id", incident);

    expect(create).toHaveBeenCalledWith({
      data: {
        ...incident,
        assignedToId: "11111111-1111-4111-8111-111111111111",
      },
    });
  });

  it("filters incidents by assignee while preserving access rules", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      incident: { findMany, count },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await service.findAll("viewer-id", {
      assigneeId: "engineer-id",
      limit: 10,
    } as never);

    const where = (
      findMany.mock.calls as unknown as Array<[{ where: unknown }]>
    )[0]?.[0]?.where as {
      AND: Array<unknown>;
    };
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { assignedToId: "engineer-id" },
        {
          OR: [
            { assignedToId: "viewer-id" },
            { team: { ownerId: "viewer-id" } },
            { team: { teamMembers: { some: { userId: "viewer-id" } } } },
          ],
        },
      ])
    );
    expect(count).toHaveBeenCalledWith({ where });
  });

  it.each([null, { chain: [] }])(
    "throws ConflictException when no primary on-call engineer is available (%p)",
    async (onCallResult) => {
      const create = jest.fn();
      const prisma = { incident: { create } } as unknown as PrismaService;
      const getCurrentOnCall = jest.fn().mockResolvedValue(onCallResult);
      const onCall = { getCurrentOnCall } as unknown as OnCallService;
      const service = new IncidentsService(prisma, onCall);

      await expect(service.create("owner-id", incident)).rejects.toBeInstanceOf(
        ConflictException
      );
      expect(create).not.toHaveBeenCalled();
    }
  );

  it("derives lifecycle timeline from incident timestamps", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const acknowledgedAt = new Date("2026-01-01T00:05:00.000Z");
    const resolvedAt = new Date("2026-01-01T00:35:00.000Z");
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      createdAt,
      acknowledgedAt,
      resolvedAt,
      mttaSeconds: 300,
      mttrSeconds: 2100,
    });
    const prisma = { incident: { findFirst } } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(service.findOne("user-id", "incident-id")).resolves.toEqual(
      expect.objectContaining({
        metrics: { mttaSeconds: 300, mttrSeconds: 2100 },
        timeline: [
          { type: "created", at: createdAt },
          { type: "acknowledged", at: acknowledgedAt },
          { type: "resolved", at: resolvedAt },
        ],
      })
    );
  });

  it("keeps unresolved metrics and events empty when an incident is open", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      createdAt,
      acknowledgedAt: null,
      resolvedAt: null,
      mttaSeconds: null,
      mttrSeconds: null,
    });
    const prisma = { incident: { findFirst } } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(service.findOne("user-id", "incident-id")).resolves.toEqual(
      expect.objectContaining({
        metrics: { mttaSeconds: null, mttrSeconds: null },
        timeline: [{ type: "created", at: createdAt }],
      })
    );
  });

  it("acknowledges an open incident and records MTTA", async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "incident-id",
        status: "open",
        assignedToId: "engineer-id",
        createdAt: new Date(Date.now() - 5_000),
        team: null,
      })
      .mockResolvedValueOnce({ id: "incident-id", status: "acknowledged" });
    const updates: unknown[] = [];
    const updateMany = jest.fn((args: unknown) => {
      updates.push(args);
      return Promise.resolve({ count: 1 });
    });
    const prisma = {
      incident: { create: jest.fn(), findUnique, updateMany },
    } as unknown as PrismaService;
    const onCall = {} as OnCallService;
    const service = new IncidentsService(prisma, onCall);

    await service.acknowledge("engineer-id", "incident-id");

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "incident-id", status: "open" },
      })
    );
    const update = updates[0] as {
      data: {
        status: string;
        acknowledgedAt: unknown;
        mttaSeconds: unknown;
      };
    };
    expect(update.data.status).toBe("acknowledged");
    expect(update.data.acknowledgedAt).toBeInstanceOf(Date);
    expect(update.data.mttaSeconds).toEqual(expect.any(Number));
  });

  it("resolves an acknowledged incident and records MTTR", async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "incident-id",
        status: "acknowledged",
        assignedToId: "engineer-id",
        createdAt: new Date(Date.now() - 5_000),
      })
      .mockResolvedValueOnce({ id: "incident-id", status: "resolved" });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      incident: { create: jest.fn(), findUnique, updateMany },
    } as unknown as PrismaService;
    const onCall = {} as OnCallService;
    const service = new IncidentsService(prisma, onCall);

    await service.resolve("engineer-id", "incident-id");

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "incident-id",
          status: "acknowledged",
          assignedToId: "engineer-id",
        },
      })
    );
    const update = (
      updateMany.mock.calls as unknown as Array<
        [{ data: { status: string; resolvedAt: Date; mttrSeconds: number } }]
      >
    )[0]?.[0];
    expect(update?.data.status).toBe("resolved");
    expect(update?.data.resolvedAt).toBeInstanceOf(Date);
    expect(update?.data.mttrSeconds).toEqual(expect.any(Number));
  });
});
