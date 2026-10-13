// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
//
// import { Test } from "@nestjs/testing";
// import { PrismaService } from "@/common/prisma/prisma.service";
// import {
//   BadRequestException,
//   ConflictException,
//   ForbiddenException,
//   NotFoundException,
// } from "@nestjs/common";
// import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
// import { createMockPrisma, MockPrisma } from "../../../../test/prisma-mock";
// import { convertDateToUtc } from "@/common/utils/timezone";
// import { UnavailabilityService } from "./unavailability.service";
// import { FILTER_FIELD, SORT_FIELD } from "./constants";
// import { SORT_ORDER } from "@/common/constants";
//
// const TEAM_ID = "teamId";
// const OWNER_ID = "ownerId";
// const MEMBER_ID = 1;
// const UNAVAILABILITY_ID = 10;
// const NOW_DATE = new Date("2026-01-15T00:00:00.000Z");
//
// const makeTeam = () => ({
//   id: TEAM_ID,
//   ownerId: OWNER_ID,
//   name: "frontend",
//   description: "frontend team",
//   services: ["frontend-app"],
//   rotationPeriodDays: 7,
//   rotationStartDate: NOW_DATE,
//   escalationTimeoutMinutes: 30,
//   currentRotationIndex: 0,
//   lastRotatedAt: NOW_DATE,
//   createdAt: NOW_DATE,
//   updatedAt: NOW_DATE,
// });
//
// const makeTeamMember = (overrides: Partial<Record<string, unknown>> = {}) => ({
//   id: MEMBER_ID,
//   teamId: TEAM_ID,
//   userId: "userId",
//   isCaptain: false,
//   joinedAt: NOW_DATE,
//   createdAt: NOW_DATE,
//   updatedAt: NOW_DATE,
//   team: makeTeam(),
//   ...overrides,
// });
//
// const makeUnavailability = (overrides: Record<string, unknown> = {}) => ({
//   id: UNAVAILABILITY_ID,
//   memberId: MEMBER_ID,
//   startDate: NOW_DATE,
//   endDate: new Date("2026-01-16T00:00:00.000Z"),
//   reason: "vacation",
//   confirmed: false,
//   status: "PENDING" as const,
//   createdAt: NOW_DATE,
//   ...overrides,
// });
//
// describe("UnavailabilityService", () => {
//   let service: UnavailabilityService;
//   let prisma: MockPrisma;
//
//   beforeEach(async () => {
//     jest.useFakeTimers();
//     jest.setSystemTime(NOW_DATE);
//
//     prisma = createMockPrisma();
//
//     const module = await Test.createTestingModule({
//       providers: [
//         UnavailabilityService,
//         {
//           provide: PrismaService,
//           useValue: prisma,
//         },
//       ],
//     }).compile();
//
//     service = module.get<UnavailabilityService>(UnavailabilityService);
//   });
//
//   afterEach(() => {
//     jest.useRealTimers();
//     jest.clearAllMocks();
//   });
//
//   describe("create", () => {
//     const createUnavailabilityDto = {
//       startDate: new Date("2026-01-20T10:00:00.000Z"),
//       endDate: new Date("2026-01-21T10:00:00.000Z"),
//       timezone: "America/New_York",
//       reason: "sick leave",
//     };
//
//     it("should create a pending unavailability when the requester is the member themself", async () => {
//       // requester is the member creating their own unavailability
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: "userId" })
//       );
//
//       const created = makeUnavailability({
//         confirmed: false,
//         status: "PENDING",
//       });
//
//       prisma.unavailability.create.mockResolvedValue(created);
//
//       const result = await service.create(
//         "userId",
//         TEAM_ID,
//         MEMBER_ID,
//         createUnavailabilityDto
//       );
//
//       expect(result).toEqual(created);
//
//       expect(prisma.unavailability.create).toHaveBeenCalledWith({
//         data: {
//           memberId: MEMBER_ID,
//           startDate: convertDateToUtc(
//             createUnavailabilityDto.startDate,
//             createUnavailabilityDto.timezone
//           ),
//           endDate: convertDateToUtc(
//             createUnavailabilityDto.endDate,
//             createUnavailabilityDto.timezone,
//             true
//           ),
//           reason: createUnavailabilityDto.reason,
//         },
//       });
//     });
//
//     it("should throw ForbiddenException when the requester is the team owner, not the member", async () => {
//       // requester is the team owner, not the member themself
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: MEMBER_ID })
//       );
//
//       await expect(
//         service.create(OWNER_ID, TEAM_ID, MEMBER_ID, createUnavailabilityDto)
//       ).rejects.toThrow(ForbiddenException);
//
//       expect(prisma.unavailability.create).not.toHaveBeenCalled();
//     });
//
//     it("should throw BadRequestException when start date is after end date", async () => {
//       await expect(
//         service.create("userId", TEAM_ID, MEMBER_ID, {
//           ...createUnavailabilityDto,
//           startDate: new Date("2026-01-22T10:00:00.000Z"), // after endDate
//         })
//       ).rejects.toThrow(BadRequestException);
//
//       expect(prisma.unavailability.create).not.toHaveBeenCalled();
//     });
//
//     it("should throw NotFoundException when the team member doesn't exist", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(null);
//
//       await expect(
//         service.create("userId", TEAM_ID, MEMBER_ID, createUnavailabilityDto)
//       ).rejects.toThrow(NotFoundException);
//
//       expect(prisma.unavailability.create).not.toHaveBeenCalled();
//     });
//
//     it("should throw ConflictException when an overlapping unavailability exists", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: "userId" })
//       );
//
//       prisma.unavailability.create.mockRejectedValue(
//         new PrismaClientKnownRequestError("window exists", {
//           code: "P2002",
//           clientVersion: "5.0.0",
//         })
//       );
//
//       await expect(
//         service.create("userId", TEAM_ID, MEMBER_ID, createUnavailabilityDto)
//       ).rejects.toThrow(ConflictException);
//     });
//   });
//
//   describe("verifyTeamOwnership", () => {
//     it("should throw NotFoundException when the team does not exist", async () => {
//       prisma.team.findUnique.mockResolvedValue(null);
//
//       await expect(
//         service.findTeamAll(OWNER_ID, TEAM_ID, {
//           limit: 20,
//           offset: 0,
//           sortField: SORT_FIELD.CREATED_AT,
//           sortOrder: SORT_ORDER.ASC,
//           filterField: FILTER_FIELD.ALL,
//         })
//       ).rejects.toThrow(NotFoundException);
//
//       expect(prisma.unavailability.findMany).not.toHaveBeenCalled();
//     });
//
//     it("should throw NotFoundException when the requester is not the owner", async () => {
//       prisma.team.findUnique.mockResolvedValue(makeTeam());
//
//       await expect(
//         service.findTeamAll("notTheOwner", TEAM_ID, {
//           limit: 20,
//           offset: 0,
//           sortField: SORT_FIELD.CREATED_AT,
//           sortOrder: SORT_ORDER.ASC,
//           filterField: FILTER_FIELD.ALL,
//         })
//       ).rejects.toThrow(NotFoundException);
//     });
//   });
//
//   describe("findTeamAll", () => {
//     const defaultQuery = {
//       limit: 20,
//       offset: 0,
//       sortField: SORT_FIELD.CREATED_AT,
//       sortOrder: SORT_ORDER.ASC,
//       filterField: FILTER_FIELD.ALL,
//     };
//
//     beforeEach(() => {
//       prisma.team.findUnique.mockResolvedValue(makeTeam());
//     });
//
//     it("should return unavailabilities scoped to the team with a total count", async () => {
//       const unavailabilities = [makeUnavailability({ id: 1 })];
//
//       prisma.unavailability.findMany.mockResolvedValue(unavailabilities);
//       prisma.unavailability.count.mockResolvedValue(1);
//
//       const result = await service.findTeamAll(OWNER_ID, TEAM_ID, defaultQuery);
//
//       expect(result).toEqual({ unavailabilities, total: 1 });
//
//       const where = {
//         teamMember: {
//           teamId: TEAM_ID,
//           team: { ownerId: OWNER_ID },
//         },
//       };
//
//       expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where,
//           skip: 0,
//           take: 20,
//           orderBy: { createdAt: SORT_ORDER.ASC },
//         })
//       );
//       expect(prisma.unavailability.count).toHaveBeenCalledWith({ where });
//     });
//
//     it("should return an empty list and a zero total when there are no unavailabilities", async () => {
//       prisma.unavailability.findMany.mockResolvedValue([]);
//       prisma.unavailability.count.mockResolvedValue(0);
//
//       const result = await service.findTeamAll(OWNER_ID, TEAM_ID, defaultQuery);
//
//       expect(result).toEqual({ unavailabilities: [], total: 0 });
//     });
//
//     it("should pass the offset and limit through to the query", async () => {
//       prisma.unavailability.findMany.mockResolvedValue([]);
//       prisma.unavailability.count.mockResolvedValue(45);
//
//       await service.findTeamAll(OWNER_ID, TEAM_ID, {
//         ...defaultQuery,
//         offset: 20,
//         limit: 10,
//         sortOrder: SORT_ORDER.DESC,
//         filterField: FILTER_FIELD.ALL,
//       });
//
//       expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
//         expect.objectContaining({
//           skip: 20,
//           take: 10,
//           orderBy: { createdAt: SORT_ORDER.DESC },
//         })
//       );
//     });
//
//     it("should rethrow unexpected errors", async () => {
//       const error = new Error("db down");
//       prisma.unavailability.findMany.mockRejectedValue(error);
//
//       await expect(
//         service.findTeamAll(OWNER_ID, TEAM_ID, defaultQuery)
//       ).rejects.toThrow(error);
//     });
//   });
//
//   describe("findPending", () => {
//     const defaultQuery = {
//       limit: 20,
//       offset: 0,
//       sortField: SORT_FIELD.CREATED_AT,
//       sortOrder: SORT_ORDER.ASC,
//       filterField: FILTER_FIELD.ALL,
//     };
//
//     it("should return pending unavailabilities with a total count", async () => {
//       prisma.team.findUnique.mockResolvedValue(makeTeam());
//
//       const pending = [makeUnavailability({ confirmed: false })];
//
//       prisma.unavailability.findMany.mockResolvedValue(pending);
//       prisma.unavailability.count.mockResolvedValue(1);
//
//       const result = await service.findTeamPending(
//         OWNER_ID,
//         TEAM_ID,
//         defaultQuery
//       );
//
//       expect(result).toEqual({ unavailabilities: pending, total: 1 });
//
//       expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: {
//             confirmed: false,
//             status: "PENDING",
//             teamMember: {
//               teamId: TEAM_ID,
//               team: { ownerId: OWNER_ID },
//             },
//           },
//           skip: 0,
//           take: 20,
//           orderBy: { createdAt: SORT_ORDER.ASC },
//         })
//       );
//       expect(prisma.unavailability.count).toHaveBeenCalledTimes(1);
//     });
//   });
//
//   describe("findMember", () => {
//     const defaultQuery = {
//       limit: 20,
//       offset: 0,
//       sortField: SORT_FIELD.CREATED_AT,
//       sortOrder: SORT_ORDER.ASC,
//       filterField: FILTER_FIELD.ALL,
//     };
//
//     it("should return a member's unavailabilities with a total count", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//
//       const memberUnavailabilities = [makeUnavailability()];
//
//       prisma.unavailability.findMany.mockResolvedValue(memberUnavailabilities);
//       prisma.unavailability.count.mockResolvedValue(1);
//
//       const result = await service.findMember(
//         OWNER_ID,
//         TEAM_ID,
//         MEMBER_ID,
//         defaultQuery
//       );
//
//       expect(result).toEqual({
//         unavailabilities: memberUnavailabilities,
//         total: 1,
//       });
//
//       expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: { memberId: MEMBER_ID },
//           skip: 0,
//           take: 20,
//         })
//       );
//     });
//
//     it("should filter by the uppercase Prisma status when a filter is given", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//       prisma.unavailability.findMany.mockResolvedValue([]);
//       prisma.unavailability.count.mockResolvedValue(0);
//
//       await service.findMember(OWNER_ID, TEAM_ID, MEMBER_ID, {
//         ...defaultQuery,
//         filterField: FILTER_FIELD.PENDING,
//       });
//
//       expect(prisma.unavailability.findMany).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: { memberId: MEMBER_ID, status: "PENDING" },
//         })
//       );
//       expect(prisma.unavailability.count).toHaveBeenCalledWith({
//         where: { memberId: MEMBER_ID, status: "PENDING" },
//       });
//     });
//   });
//
//   describe("removeMemberAll", () => {
//     it("should delete all of a member's unavailabilities", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//       prisma.unavailability.deleteMany.mockResolvedValue({ count: 2 });
//
//       await service.removeMemberAll(OWNER_ID, TEAM_ID, MEMBER_ID);
//
//       expect(prisma.unavailability.deleteMany).toHaveBeenCalledWith({
//         where: { memberId: MEMBER_ID },
//       });
//     });
//
//     it("should throw ForbiddenException when the requester is not authorized", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//
//       await expect(
//         service.removeMemberAll("notTheOwner", TEAM_ID, MEMBER_ID)
//       ).rejects.toThrow(ForbiddenException);
//
//       expect(prisma.unavailability.deleteMany).not.toHaveBeenCalled();
//     });
//   });
//
//   describe("removeMemberOne", () => {
//     it("should delete a single unavailability", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//
//       await service.removeMemberOne(
//         OWNER_ID,
//         TEAM_ID,
//         MEMBER_ID,
//         UNAVAILABILITY_ID
//       );
//
//       expect(prisma.unavailability.delete).toHaveBeenCalledWith({
//         where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
//       });
//     });
//
//     it("should throw NotFoundException when the unavailability doesn't exist", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//       prisma.unavailability.delete.mockRejectedValue(
//         new PrismaClientKnownRequestError("does not exist", {
//           code: "P2025",
//           clientVersion: "5.0.0",
//         })
//       );
//
//       await expect(
//         service.removeMemberOne(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
//       ).rejects.toThrow(NotFoundException);
//     });
//   });
//
//   describe("update", () => {
//     it("should reset confirmation to pending when the member updates their own unavailability", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: "userId" })
//       );
//       prisma.unavailability.findUnique.mockResolvedValue(
//         makeUnavailability({ confirmed: true, status: "APPROVED" })
//       );
//
//       const updated = makeUnavailability({
//         reason: "family",
//         confirmed: false,
//         status: "PENDING",
//       });
//
//       prisma.unavailability.update.mockResolvedValue(updated);
//
//       const result = await service.update(
//         "userId",
//         TEAM_ID,
//         MEMBER_ID,
//         UNAVAILABILITY_ID,
//         { reason: "family" }
//       );
//
//       expect(result).toEqual(updated);
//
//       expect(prisma.unavailability.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
//           data: expect.objectContaining({
//             confirmed: false,
//             status: "PENDING",
//           }),
//         })
//       );
//     });
//
//     it("should throw ForbiddenException when the requester is the team owner, not the member", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: MEMBER_ID })
//       );
//
//       await expect(
//         service.update(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
//           reason: "family",
//         })
//       ).rejects.toThrow(ForbiddenException);
//
//       expect(prisma.unavailability.update).not.toHaveBeenCalled();
//     });
//
//     it("should throw NotFoundException when the unavailability does not exist", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: "userId" })
//       );
//       prisma.unavailability.findUnique.mockResolvedValue(null);
//
//       await expect(
//         service.update("userId", TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
//           reason: "family",
//         })
//       ).rejects.toThrow(NotFoundException);
//     });
//
//     it("should throw NotFoundException when the team member doesn't exist", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(null);
//
//       await expect(
//         service.update("userId", TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
//           reason: "family",
//         })
//       ).rejects.toThrow(NotFoundException);
//
//       expect(prisma.unavailability.update).not.toHaveBeenCalled();
//     });
//
//     it("should convert dates to UTC and keep them within the existing window", async () => {
//       prisma.teamMember.findUnique.mockResolvedValue(
//         makeTeamMember({ userId: "userId" })
//       );
//       prisma.unavailability.findUnique.mockResolvedValue(makeUnavailability());
//
//       prisma.unavailability.update.mockResolvedValue(
//         makeUnavailability({ startDate: NOW_DATE })
//       );
//
//       const startDate = new Date("2026-01-15T12:00:00.000Z");
//       await service.update("userId", TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID, {
//         startDate,
//         timezone: "America/New_York",
//       });
//
//       const expectedStart = convertDateToUtc(startDate, "America/New_York");
//       expect(prisma.unavailability.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           data: expect.objectContaining({ startDate: expectedStart }),
//         })
//       );
//     });
//   });
//
//   describe("confirm", () => {
//     it("should confirm a pending unavailability", async () => {
//       prisma.team.findUnique.mockResolvedValue(makeTeam());
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//       prisma.unavailability.findUnique.mockResolvedValue(
//         makeUnavailability({ confirmed: false })
//       );
//
//       await service.confirm(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID);
//
//       expect(prisma.unavailability.update).toHaveBeenCalledWith({
//         where: { id: UNAVAILABILITY_ID, memberId: MEMBER_ID },
//         data: { confirmed: true, status: "APPROVED" },
//       });
//     });
//
//     it("should throw BadRequestException when the unavailability is already confirmed", async () => {
//       prisma.team.findUnique.mockResolvedValue(makeTeam());
//       prisma.teamMember.findUnique.mockResolvedValue(makeTeamMember());
//       prisma.unavailability.findUnique.mockResolvedValue(
//         makeUnavailability({ confirmed: true, status: "APPROVED" })
//       );
//
//       await expect(
//         service.confirm(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
//       ).rejects.toThrow(BadRequestException);
//
//       expect(prisma.unavailability.update).not.toHaveBeenCalled();
//     });
//
//     it("should throw NotFoundException when the member doesn't exist", async () => {
//       prisma.team.findUnique.mockResolvedValue(makeTeam());
//       prisma.teamMember.findUnique.mockResolvedValue(null);
//
//       await expect(
//         service.confirm(OWNER_ID, TEAM_ID, MEMBER_ID, UNAVAILABILITY_ID)
//       ).rejects.toThrow(NotFoundException);
//
//       expect(prisma.unavailability.update).not.toHaveBeenCalled();
//     });
//   });
// });
