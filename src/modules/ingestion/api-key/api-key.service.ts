import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "src/common/prisma/prisma.service";

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  async create(ownerId: string, name: string) {
    const rawKey = `alert_${randomBytes(32).toString("hex")}`;
    const keyHash = this.hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    try {
      await this.prisma.apiKey.create({
        data: {
          ownerId,
          name,
          keyPrefix,
          keyHash,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(
            "An API key with this name already exists"
          );
        }
      }
    }

    return {
      apiKey: rawKey,
      prefix: keyPrefix,
    };
  }

  async findAll(ownerId: string) {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        enabled: true,
        createdAt: true,
      },
    });

    return apiKeys;
  }

  async disable(ownerId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { ownerId, id },
    });

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { enabled: false },
    });
  }

  async enable(ownerId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { ownerId, id },
    });

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { enabled: true },
    });
  }

  async delete(ownerId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { ownerId, id },
    });

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    await this.prisma.apiKey.delete({ where: { id: apiKey.id } });
  }
}
