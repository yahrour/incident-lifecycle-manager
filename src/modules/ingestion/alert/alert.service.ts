import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  private hashApiKey(rawKey: string) {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  async verifyApiKey(providedKey?: string): Promise<boolean> {
    if (!providedKey) {
      return false;
    }

    const keyHash = this.hashApiKey(providedKey);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.enabled) {
      return false;
    }

    if (keyHash !== apiKey.keyHash) {
      return false;
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return false;
    }

    return true;
  }
}
