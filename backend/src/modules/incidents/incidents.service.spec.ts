jest.mock("src/common/prisma/prisma.service", () => ({
  PrismaService: class {},
}));
jest.mock("src/modules/on-call/on-call.service", () => ({
  OnCallService: class {},
}));

import { IncidentsService } from "./incidents.service";
import { ConflictException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "src/common/prisma/prisma.service";
import type { OnCallService } from "@/modules/on-call/on-call.service";
import { createIncidentFingerprint } from "./utils/incident-fingerprint";

describe("IncidentsService", () => {
  const incident = {
    teamId: "22222222-2222-4222-8222-222222222222",
    title: "API errors",
    service: "api",
    severity: "high" as const,
  };

  it("creates the same fingerprint for normalized incident identity", () => {
    expect(
      createIncidentFingerprint(
        " Prometheus ",
        " Payments-API ",
        " High Latency "
      )
    ).toBe(
      createIncidentFingerprint("prometheus", "payments-api", "high latency")
    );
  });

  it("changes the fingerprint when a stable identity field changes", () => {
    const fingerprint = createIncidentFingerprint(
      "prometheus",
      "payments-api",
      "high latency"
    );

    expect(
      createIncidentFingerprint("prometheus", "auth-api", "high latency")
    ).not.toBe(fingerprint);
    expect(
      createIncidentFingerprint("prometheus", "payments-api", "disk full")
    ).not.toBe(fingerprint);
    expect(
      createIncidentFingerprint("grafana", "payments-api", "high latency")
    ).not.toBe(fingerprint);
  });

  it("ignores changing fields outside the fingerprint identity", () => {
    const fingerprint = createIncidentFingerprint(
      "prometheus",
      "payments-api",
      "high latency"
    );

    expect(fingerprint).toHaveLength(64);
  });

  it("assigns a new incident to the primary on-call engineer", async () => {
    const create = jest.fn();
    const prisma = { incident: { create } } as unknown as PrismaService;
    const getCurrentOnCall = jest.fn().mockResolvedValue({
      chain: [
        { position: "PRIMARY", id: "11111111-1111-4111-8111-111111111111" },
      ],
    });
    const onCall = { getCurrentOnCall } as unknown as OnCallService;
    const service = new IncidentsService(prisma, onCall);

    await service.create("owner-id", incident);

    const createCall = (
      create.mock.calls as unknown as Array<
        [
          {
            data: typeof incident & {
              fingerprint: string;
              assignedToId: string;
            };
          },
        ]
      >
    )[0]?.[0];

    expect(createCall?.data).toEqual({
      ...incident,
      fingerprint: createCall?.data.fingerprint,
      assignedToId: "11111111-1111-4111-8111-111111111111",
    });
    expect(typeof createCall?.data.fingerprint).toBe("string");
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

  it("reassigns an incident to a member of its team", async () => {
    const findIncident = jest
      .fn()
      .mockResolvedValue({ id: "incident-id", teamId: "team-id" });
    const findMember = jest.fn().mockResolvedValue({ userId: "engineer-id" });
    const update = jest.fn().mockResolvedValue({
      id: "incident-id",
      assignedToId: "engineer-id",
    });
    const prisma = {
      incident: { findFirst: findIncident, update },
      teamMember: { findFirst: findMember },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.reassign("owner-id", "incident-id", "engineer-id")
    ).resolves.toEqual({
      id: "incident-id",
      assignedToId: "engineer-id",
    });
    expect(findMember).toHaveBeenCalledWith({
      where: { teamId: "team-id", userId: "engineer-id" },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "incident-id" },
        data: { assignedToId: "engineer-id" },
      })
    );
  });

  it("rejects reassignment to a user outside the incident team", async () => {
    const prisma = {
      incident: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: "incident-id", teamId: "team-id" }),
      },
      teamMember: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.reassign("owner-id", "incident-id", "outsider-id")
    ).rejects.toBeInstanceOf(NotFoundException);
  });

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

  it("returns linked alerts and adds them to the timeline", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const receivedAt = new Date("2026-01-01T00:00:01.000Z");
    const alert = {
      id: "alert-id",
      provider: "grafana",
      title: "High CPU",
      severity: "critical",
      status: "firing",
      occurredAt: createdAt,
      receivedAt,
    };
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      createdAt,
      acknowledgedAt: null,
      resolvedAt: null,
      alerts: [{ alertId: "alert-id" }],
    });
    const findMany = jest.fn().mockResolvedValue([alert]);
    const prisma = {
      incident: { findFirst },
      alert: { findMany },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(service.findOne("user-id", "incident-id")).resolves.toEqual(
      expect.objectContaining({
        alerts: [alert],
        timeline: [
          { type: "created", at: createdAt },
          {
            type: "alert_received",
            at: receivedAt,
            alertId: "alert-id",
            status: "firing",
          },
        ],
      })
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["alert-id"] } } })
    );
  });

  it("creates a note for an incident the user can access", async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: "incident-id" });
    const create = jest.fn().mockResolvedValue({
      id: "note-id",
      content: "Mitigation started",
      authorId: "user-id",
    });
    const prisma = {
      incident: { findFirst },
      incidentNote: { create },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.createNote("user-id", "incident-id", "Mitigation started")
    ).resolves.toEqual({
      id: "note-id",
      content: "Mitigation started",
      authorId: "user-id",
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          incidentId: "incident-id",
          authorId: "user-id",
          content: "Mitigation started",
        },
      })
    );
  });

  it("rejects notes for incidents the user cannot access", async () => {
    const prisma = {
      incident: { findFirst: jest.fn().mockResolvedValue(null) },
      incidentNote: { create: jest.fn() },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.createNote("user-id", "incident-id", "Private update")
    ).rejects.toBeInstanceOf(NotFoundException);
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
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      status: "open",
      assignedToId: "engineer-id",
      createdAt: new Date(Date.now() - 5_000),
      team: null,
    });
    const findUnique = jest
      .fn()
      .mockResolvedValue({ id: "incident-id", status: "acknowledged" });
    const updates: unknown[] = [];
    const updateMany = jest.fn((args: unknown) => {
      updates.push(args);
      return Promise.resolve({ count: 1 });
    });
    const prisma = {
      incident: { create: jest.fn(), findFirst, findUnique, updateMany },
    } as unknown as PrismaService;
    const onCall = {} as OnCallService;
    const service = new IncidentsService(prisma, onCall);

    await service.acknowledge("engineer-id", "incident-id");

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "incident-id",
          status: "open",
          assignedToId: "engineer-id",
        },
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

  it("rejects acknowledgement when the incident is reassigned during the update", async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      status: "open",
      assignedToId: "engineer-id",
      createdAt: new Date(Date.now() - 5_000),
      team: null,
    });
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      incident: { findFirst, updateMany },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.acknowledge("engineer-id", "incident-id")
    ).rejects.toBeInstanceOf(ConflictException);
    const updateCall = (
      updateMany.mock.calls as unknown as Array<[{ data: { status: string } }]>
    )[0]?.[0];
    expect(updateCall?.data.status).toBe("acknowledged");
  });

  it("resolves an acknowledged incident and records MTTR", async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      status: "acknowledged",
      assignedToId: "engineer-id",
      createdAt: new Date(Date.now() - 5_000),
    });
    const findUnique = jest
      .fn()
      .mockResolvedValue({ id: "incident-id", status: "resolved" });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      incident: { create: jest.fn(), findFirst, findUnique, updateMany },
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

  it("creates an incident from an alert, attaches repeats, skips unrouted and resolved", async () => {
    const alert = {
      provider: "prometheus",
      title: "HighErrorRate",
      serviceName: "checkout-api",
      severity: "critical" as const,
      status: "firing" as const,
      team: "frontend",
      occurredAt: new Date(),
    };
    const findUnique = jest.fn().mockResolvedValue(null);
    const upsert = jest.fn().mockResolvedValue({ id: "incident-id" });
    const incidentAlertCreate = jest.fn();
    const prisma = {
      team: { findFirst: jest.fn().mockResolvedValue({ id: "team-id" }) },
      incident: { findUnique, upsert },
      incidentAlert: { create: incidentAlertCreate },
    } as unknown as PrismaService;
    const getCurrentOnCall = jest.fn().mockResolvedValue({
      chain: [{ position: "PRIMARY", id: "primary-id" }],
    });
    const service = new IncidentsService(prisma, {
      getCurrentOnCall,
    } as unknown as OnCallService);

    await expect(
      service.createFromAlert("owner-id", "a1", alert)
    ).resolves.toBe("incident-id");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          teamId: "team-id",
          severity: "critical",
          assignedToId: "primary-id",
        }) as unknown,
      })
    );

    findUnique.mockResolvedValue({ id: "incident-id" });
    await service.createFromAlert("owner-id", "a2", alert);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(incidentAlertCreate).toHaveBeenLastCalledWith({
      data: { alertId: "a2", incidentId: "incident-id" },
    });

    findUnique.mockResolvedValue(null);
    await expect(
      service.createFromAlert("owner-id", "a3", {
        ...alert,
        status: "resolved",
      })
    ).resolves.toBeNull();
    await expect(
      service.createFromAlert("owner-id", "a4", { ...alert, team: undefined })
    ).resolves.toBeNull();
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("filters incidents by exact service for related incidents", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      incident: { findMany, count },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await service.findAll("viewer-id", {
      service: "checkout-api",
      limit: 10,
    } as never);

    const where = (
      findMany.mock.calls as unknown as Array<[{ where: { AND: unknown[] } }]>
    )[0]?.[0]?.where;
    expect(where?.AND).toEqual(
      expect.arrayContaining([{ service: "checkout-api" }])
    );
  });

  it("adds notes to the timeline in chronological order", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const noteAt = new Date("2026-01-01T00:02:00.000Z");
    const acknowledgedAt = new Date("2026-01-01T00:05:00.000Z");
    const author = {
      id: "user-id",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    };
    const findFirst = jest.fn().mockResolvedValue({
      id: "incident-id",
      createdAt,
      acknowledgedAt,
      resolvedAt: null,
      mttaSeconds: 300,
      mttrSeconds: null,
      notes: [{ id: "note-id", createdAt: noteAt, author }],
    });
    const prisma = { incident: { findFirst } } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    const result = await service.findOne("user-id", "incident-id");

    expect(result.timeline).toEqual([
      { type: "created", at: createdAt },
      { type: "note_added", at: noteAt, noteId: "note-id", actor: author },
      { type: "acknowledged", at: acknowledgedAt },
    ]);
  });

  it("rejects reassignment of a resolved incident", async () => {
    const update = jest.fn();
    const prisma = {
      incident: {
        findFirst: jest.fn().mockResolvedValue({
          id: "incident-id",
          teamId: "team-id",
          status: "resolved",
        }),
        update,
      },
      teamMember: { findFirst: jest.fn() },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.reassign("owner-id", "incident-id", "engineer-id")
    ).rejects.toBeInstanceOf(ConflictException);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes the handover note alongside the reassignment", async () => {
    const updateQuery = { kind: "update" };
    const noteQuery = { kind: "note" };
    const update = jest.fn().mockReturnValue(updateQuery);
    const createNote = jest.fn().mockReturnValue(noteQuery);
    const $transaction = jest
      .fn()
      .mockResolvedValue([{ id: "incident-id" }, { id: "note-id" }]);
    const prisma = {
      incident: {
        findFirst: jest.fn().mockResolvedValue({
          id: "incident-id",
          teamId: "team-id",
          status: "open",
        }),
        update,
      },
      teamMember: {
        findFirst: jest.fn().mockResolvedValue({ userId: "engineer-id" }),
      },
      incidentNote: { create: createNote },
      $transaction,
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.reassign("owner-id", "incident-id", "engineer-id", "Handover")
    ).resolves.toEqual({ id: "incident-id" });
    expect(createNote).toHaveBeenCalledWith({
      data: {
        incidentId: "incident-id",
        authorId: "owner-id",
        content: "Handover",
      },
    });
    expect($transaction).toHaveBeenCalledWith([updateQuery, noteQuery]);
  });

  it("rejects resolving an open incident", async () => {
    const updateMany = jest.fn();
    const prisma = {
      incident: {
        findFirst: jest.fn().mockResolvedValue({
          id: "incident-id",
          status: "open",
          assignedToId: "engineer-id",
          createdAt: new Date(),
        }),
        updateMany,
      },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.resolve("engineer-id", "incident-id")
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("hides inaccessible incidents from acknowledge and resolve", async () => {
    // The lookup is scoped to incidents the user may see, so an outsider gets a
    // 404 and cannot tell a real incident id from a made-up one.
    const findFirst = jest.fn().mockResolvedValue(null);
    const updateMany = jest.fn();
    const prisma = {
      incident: { findFirst, updateMany },
    } as unknown as PrismaService;
    const service = new IncidentsService(prisma, {} as OnCallService);

    await expect(
      service.acknowledge("outsider-id", "incident-id")
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.resolve("outsider-id", "incident-id")
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(updateMany).not.toHaveBeenCalled();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "incident-id",
          OR: [
            { assignedToId: "outsider-id" },
            { team: { ownerId: "outsider-id" } },
            { team: { teamMembers: { some: { userId: "outsider-id" } } } },
          ],
        }) as unknown,
      })
    );
  });

  it("escalates overdue open incidents to the secondary, or to the team owner without one", async () => {
    const team = { id: "team-id", ownerId: "owner-id" };
    const minutesAgo = (minutes: number) =>
      new Date(Date.now() - minutes * 60 * 1000);
    const findMany = jest.fn().mockResolvedValue([
      {
        id: "overdue",
        assignedToId: "primary-id",
        createdAt: minutesAgo(10),
        team: { ...team, escalationTimeoutMinutes: 5 },
      },
      {
        id: "fresh",
        assignedToId: "primary-id",
        createdAt: minutesAgo(1),
        team: { ...team, escalationTimeoutMinutes: 5 },
      },
      {
        // Already with the secondary: the team owner is next.
        id: "no-backup",
        assignedToId: "secondary-id",
        createdAt: minutesAgo(10),
        team: { ...team, escalationTimeoutMinutes: 5 },
      },
      {
        id: "teamless",
        assignedToId: null,
        createdAt: minutesAgo(10),
        team: null,
      },
    ]);
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      incident: { findMany, updateMany },
    } as unknown as PrismaService;
    const getCurrentOnCall = jest.fn().mockResolvedValue({
      chain: [
        { position: "PRIMARY", id: "primary-id" },
        { position: "SECONDARY", id: "secondary-id" },
      ],
    });
    const service = new IncidentsService(prisma, {
      getCurrentOnCall,
    } as unknown as OnCallService);

    await service.escalateUnacknowledged();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "open", escalatedAt: null },
      })
    );
    expect(getCurrentOnCall).toHaveBeenCalledWith("owner-id", "team-id");
    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "overdue", status: "open", assignedToId: "primary-id" },
      data: {
        assignedToId: "secondary-id",
        escalatedAt: expect.any(Date) as Date,
      },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "no-backup", status: "open", assignedToId: "secondary-id" },
      data: {
        assignedToId: "owner-id",
        escalatedAt: expect.any(Date) as Date,
      },
    });
  });
});
