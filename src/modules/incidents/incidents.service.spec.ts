jest.mock("src/common/prisma/prisma.service", () => ({
  PrismaService: class {},
}));
jest.mock("src/modules/organization/oncall/oncall.service", () => ({
  OnCallService: class {},
}));

import { IncidentsService } from "./incidents.service";
import { ConflictException } from "@nestjs/common";
import type { PrismaService } from "src/common/prisma/prisma.service";
import type { OnCallService } from "src/modules/organization/oncall/oncall.service";

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
      chain: [
        { role: "PRIMARY", userId: "11111111-1111-4111-8111-111111111111" },
      ],
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
});
