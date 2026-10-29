import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  StreamableFile,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import {
  CreateTeamDto,
  OffsetPaginationSearchParams,
  UpdateTeamDto,
} from "./dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { convertDateToUtc } from "@/common/utils/timezone";
import { Prisma, UnavailabilityStatus } from "@/generated/prisma/client";
import { stringify } from "csv-stringify/sync";
import { DateTime } from "luxon";
import { importTeamsSchema } from "./schemas";
import { parse } from "csv-parse/sync";

type FileFormat = "json" | "csv";
type TeamExport = {
  name: string;
  description: string | null;
  services: string[];
  rotationPeriodDays: number;
  escalationTimeoutMinutes: number;
};

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  getContentType(fileFormat: FileFormat) {
    return fileFormat === "json" ? "application/json" : "text/csv";
  }

  generateFilename(fileFormat: FileFormat) {
    const dt = DateTime.now();
    const timestamp = dt.toFormat("yyyy-MM-dd");
    const filename = `teams-${timestamp}.${fileFormat}`;
    return filename;
  }

  getFileFormat(filename: string) {
    return filename.split(".").pop()?.toLowerCase();
  }

  isValidFileFormat(fileformat: unknown) {
    return fileformat === "json" || fileformat === "csv";
  }

  serializeTeams(teams: TeamExport[], fileFormat: FileFormat): string {
    if (fileFormat === "json") {
      return JSON.stringify(teams, null, 2);
    }

    return stringify(teams, {
      header: true,
      columns: [
        { key: "name", header: "Name" },
        { key: "description", header: "Description" },
        { key: "rotationPeriodDays", header: "Rotation (days)" },
        {
          key: "escalationTimeoutMinutes",
          header: "Escalation timeout (min)",
        },
        { key: "services", header: "Services" },
      ],
    });
  }

  validateImportedTeams(rows: unknown) {
    const result = importTeamsSchema.validate(rows, {
      errors: { label: "key", wrap: { label: false } },
    });

    if (result.error) {
      const [detail] = result.error.details;
      const [index] = detail.path;
      const where = typeof index === "number" ? `Row ${index + 1}: ` : "";
      throw new UnprocessableEntityException(`${where}${detail.message}`);
    }

    return result.value;
  }

  parseJsonTeams(buffer: string) {
    let rows: unknown;

    try {
      rows = JSON.parse(buffer);
    } catch {
      throw new BadRequestException("Invalid JSON file");
    }

    return this.validateImportedTeams(rows);
  }

  parseCsvTeams(buffer: string) {
    let rows: unknown;
    const HEADER_TO_FIELD = {
      Name: "name",
      Description: "description",
      "Rotation (days)": "rotationPeriodDays",
      "Escalation timeout (min)": "escalationTimeoutMinutes",
      Services: "services",
    };

    try {
      rows = parse(buffer, {
        columns: (header) =>
          header.map(
            (h) => (HEADER_TO_FIELD as Record<string, string>)[h] ?? h
          ),
        skip_empty_lines: true,
        trim: true,
        cast: (value, context) => {
          if (context.column === "services") {
            try {
              return JSON.parse(value) as string[];
            } catch {
              return value;
            }
          }
          return value;
        },
      });
    } catch {
      throw new BadRequestException("Invalid CSV file");
    }

    return this.validateImportedTeams(rows);
  }

  async create(ownerId: string, createTeamDto: CreateTeamDto) {
    const rotationStartDate =
      createTeamDto.rotationStartDate &&
      convertDateToUtc(createTeamDto.rotationStartDate, createTeamDto.timezone);

    if (rotationStartDate && rotationStartDate <= new Date()) {
      throw new BadRequestException(
        "Rotation start date must be in the future"
      );
    }

    try {
      const team = await this.prisma.team.create({
        data: {
          ownerId,
          name: createTeamDto.name,
          description: createTeamDto.description,
          services: createTeamDto.services,
          rotationPeriodDays: createTeamDto.rotationPeriodDays,
          rotationStartDate,
          escalationTimeoutMinutes: createTeamDto.escalationTimeoutMinutes,
        },
        omit: {
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return team;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Team already exists");
        }
      }

      throw error;
    }
  }

  async update(ownerId: string, id: string, updateTeamDto: UpdateTeamDto) {
    const data: Prisma.TeamUpdateInput = {
      ...updateTeamDto,
      ...(updateTeamDto.rotationPeriodDays !== undefined && {
        currentRotationIndex: 0,
        lastRotatedAt: new Date(),
      }),
    };

    try {
      const updatedTeam = await this.prisma.team.update({
        where: {
          id,
          ownerId,
        },
        data,
        omit: {
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedTeam;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Team doesn't exist");
        }
        if (error.code === "P2002") {
          throw new ConflictException("Team already exists");
        }
      }

      throw error;
    }
  }

  async findAllForOwner(ownerId: string, query: OffsetPaginationSearchParams) {
    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: {
          ownerId,
          ...(query.search && {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          }),
        },
        skip: query.offset,
        take: query.limit,
        ...(query.sortField && {
          orderBy: {
            [query.sortField]: query.sortOrder,
          },
        }),
        omit: {
          ownerId: true,
          updatedAt: true,
          currentRotationIndex: true,
        },
      }),
      this.prisma.team.count({
        where: {
          ownerId,
          ...(query.search && {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          }),
        },
      }),
    ]);

    return { teams, total };
  }

  async findOne(ownerId: string, id: string) {
    const team = await this.prisma.team.findUnique({
      where: {
        id,
        ownerId,
      },
      omit: {
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!team) {
      throw new NotFoundException("Team doesn't exist");
    }

    return team;
  }

  async getStats(ownerId: string, id: string) {
    const now = new Date();
    const [stats, activeUnavailabilityCount] = await Promise.all([
      this.prisma.team.findUnique({
        where: {
          id,
          ownerId,
        },
        select: {
          _count: {
            select: {
              incidents: {
                where: {
                  status: "open",
                },
              },
              teamMembers: true,
            },
          },
        },
      }),

      this.prisma.unavailability.count({
        where: {
          teamMember: { team: { ownerId }, teamId: id },
          status: UnavailabilityStatus.APPROVED,
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
      }),
    ]);

    if (!stats) {
      throw new NotFoundException("Team doesn't exist");
    }

    return {
      memberCount: stats._count.teamMembers,
      openIncidentCount: stats._count.incidents,
      activeUnavailabilityCount,
    };
  }

  async remove(ownerId: string, id: string) {
    try {
      await this.prisma.team.delete({
        where: {
          id,
          ownerId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Team doesn't exist");
        }
      }

      throw error;
    }
  }

  async export(ownerId: string, fileFormat: FileFormat) {
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
      select: {
        name: true,
        description: true,
        rotationPeriodDays: true,
        escalationTimeoutMinutes: true,
        services: true,
      },
    });

    const content = this.serializeTeams(teams, fileFormat);

    return new StreamableFile(Buffer.from(content), {
      type: this.getContentType(fileFormat),
      disposition: `attachment; filename="${this.generateFilename(fileFormat)}"`,
    });
  }

  async import(ownerId: string, file: Express.Multer.File) {
    // Validate File Extension
    const format = this.getFileFormat(file.originalname);
    if (!this.isValidFileFormat(format)) {
      throw new BadRequestException("something wrong with the file extension");
    }

    // Parse
    const teams =
      format === "json"
        ? this.parseJsonTeams(file.buffer.toString())
        : this.parseCsvTeams(file.buffer.toString());

    // Create
    const { created, skipped } = await this.prisma.$transaction(async (tx) => {
      const names = teams.map((team) => team.name);
      const existing = await tx.team.findMany({
        where: { ownerId, name: { in: names } },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((t) => t.name));

      const toCreate = teams.filter((t) => !existingNames.has(t.name));

      if (toCreate.length > 0) {
        const { count } = await tx.team.createMany({
          data: toCreate.map((t) => ({ ...t, ownerId })),
          skipDuplicates: true,
        });
        return { created: count, skipped: teams.length - count };
      }

      return {
        created: 0,
        skipped: teams.length,
      };
    });

    return { total: teams.length, created, skipped };
  }
}
