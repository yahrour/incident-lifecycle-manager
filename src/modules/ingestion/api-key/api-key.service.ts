import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }
  private findOwnedApiKey(ownerId: string, id: string) {
    return this.prisma.apiKey.findFirst({
      where: { ownerId, id },
    });
  }

  async create(ownerId: string, name: string, expiresInDays: number) {
    const rawKey = `alert_${randomBytes(32).toString("hex")}`;
    const keyHash = this.hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    );

    try {
      await this.prisma.apiKey.create({
        data: {
          ownerId,
          name,
          keyPrefix,
          keyHash,
          expiresAt,
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
      throw error;
    }

    return {
      apiKey: rawKey,
      prefix: keyPrefix,
      expiresAt: expiresAt.toISOString(),
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
        expiresAt: true,
      },
    });

    const now = new Date();

    return apiKeys.map((apiKey) => {
      const expiresAt = apiKey.expiresAt;
      const isExpired = expiresAt <= now;

      return {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        enabled: apiKey.enabled,
        createdAt: apiKey.createdAt,
        expiresAt: expiresAt.toISOString(),
        isExpired,
      };
    });
  }

  async disable(ownerId: string, id: string) {
    const apiKey = await this.findOwnedApiKey(ownerId, id);

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { enabled: false },
    });
  }

  async enable(ownerId: string, id: string) {
    const apiKey = await this.findOwnedApiKey(ownerId, id);

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { enabled: true },
    });
  }

  async delete(ownerId: string, id: string) {
    const apiKey = await this.findOwnedApiKey(ownerId, id);

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    await this.prisma.apiKey.delete({ where: { id: apiKey.id } });
  }
}
