import { IncidentsController } from "./incidents.controller";

describe("IncidentsController", () => {
  it("wraps the incident list in data and meta", async () => {
    const incidents = [{ id: "incident-id" }];
    const incidentsService = {
      findAll: jest.fn().mockResolvedValue({
        data: incidents,
        total: 1,
        nextCursor: "next-cursor",
      }),
    };
    const controller = new IncidentsController(incidentsService as never);

    await expect(
      controller.findAll({} as never, { sub: "user-id" } as never)
    ).resolves.toEqual({
      data: incidents,
      meta: { total: 1, nextCursor: "next-cursor" },
    });
  });

  it("wraps one incident in data", async () => {
    const incident = { id: "incident-id" };
    const incidentsService = {
      findOne: jest.fn().mockResolvedValue(incident),
    };
    const controller = new IncidentsController(incidentsService as never);

    await expect(
      controller.findOne("incident-id", { sub: "user-id" } as never)
    ).resolves.toEqual({ data: incident });
  });

  it("wraps an acknowledged incident in data", async () => {
    const incident = { id: "incident-id", status: "acknowledged" };
    const incidentsService = {
      acknowledge: jest.fn().mockResolvedValue(incident),
    };
    const controller = new IncidentsController(incidentsService as never);

    await expect(
      controller.acknowledge("incident-id", { sub: "user-id" } as never)
    ).resolves.toEqual({ data: incident });
  });

  it("wraps a resolved incident in data", async () => {
    const incident = { id: "incident-id", status: "resolved" };
    const incidentsService = {
      resolve: jest.fn().mockResolvedValue(incident),
    };
    const controller = new IncidentsController(incidentsService as never);

    await expect(
      controller.resolve("incident-id", { sub: "user-id" } as never)
    ).resolves.toEqual({ data: incident });
  });
});
