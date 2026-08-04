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
});
