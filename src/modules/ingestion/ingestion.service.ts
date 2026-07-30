import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { createHash, randomBytes } from "crypto";

@Injectable()
export class IngestionService {
  constructor(private readonly prisma: PrismaService) {}

  async generateApiKey(ownerId: string, name: string) {
    const rawKey = `alert_${randomBytes(32).toString("hex")}`;
    const keyHash = this.hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    await this.prisma.apiKey.create({
      data: {
        ownerId,
        name,
        keyPrefix,
        keyHash,
      },
    });

    return {
      apiKey: rawKey,
      prefix: keyPrefix,
    };
  }

  async verifyApiKey(providedKey?: string): Promise<boolean> {
    if (!providedKey) {
      return false;
    }

    const keyHash = this.hashApiKey(providedKey);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || apiKey.revokedAt) {
      return false;
    }

    if (keyHash !== apiKey.keyHash) {
      return false;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  async getApiKeys(ownerId: string) {
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
  async disableApiKey(ownerId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { ownerId, id },
    });

    if (!apiKey) {
      throw new Error("API key not found");
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { enabled: false },
    });
  }
  async enableApiKey(ownerId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { ownerId, id },
    });

    if (!apiKey) {
      throw new Error("API key not found");
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { enabled: true },
    });
  }

  async deleteApiKey(ownerId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { ownerId, id },
    });
    if (!apiKey) {
      throw new Error("API key not found");
    }
    await this.prisma.apiKey.delete({
      where: { id: apiKey.id },
    });
  }
}
