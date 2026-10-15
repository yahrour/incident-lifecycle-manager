import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/common/prisma/prisma.service";

const DAY_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class TokensCleanupService {
  private readonly logger = new Logger(TokensCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const now = new Date();

    const [inviteTokens, refreshTokens] = await Promise.all([
      // invite tokens: 30 days grace
      this.prisma.inviteToken.deleteMany({
        where: {
          OR: [
            { used: true },
            { expiresAt: { lt: new Date(now.getTime() - 30 * DAY_MS) } },
          ],
        },
      }),
      // refresh tokens: no grace, expiresAt mirrors JWT exp
      this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    this.logger.log(
      `Token cleanup: invite=${inviteTokens.count}, refresh=${refreshTokens.count}`
    );
  }
}
