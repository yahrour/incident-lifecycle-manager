import { Prisma } from "@/generated/prisma/client";
import { PrismaService } from "@/common/prisma/prisma.service";
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DiscordTokenResponse,
  DiscordUserResponse,
} from "@/common/interfaces/discord.interface";

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async sendWebhookNotification(
    webhookUrl: string,
    payload: { content?: string; embeds?: unknown[] }
  ): Promise<void> {
    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.error(
          `Discord Webhook delivery failed: ${response.status} ${response.statusText}`
        );
      } else {
        this.logger.log(
          `Discord Webhook delivered successfully: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      this.logger.error("Failed to send Discord webhook notification", error);
    }
  }

  buildAuthorizeUrl(): string {
    const params = new URLSearchParams({
      client_id: this.configService.getOrThrow("DISCORD_CLIENT_ID"),
      redirect_uri: this.configService.getOrThrow("DISCORD_REDIRECT_URI"),
      response_type: "code",
      scope: "identify",
    });
    return `https://discord.com/oauth2/authorize?${params}`;
  }

  async linkAccount(userId: string, code: string): Promise<void> {
    const accessToken = await this.exchangeCodeForToken(code);
    const discordUser = await this.fetchDiscordUser(accessToken);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { discordId: discordUser.id, discordName: discordUser.username },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictException(
          "This Discord account is already linked to another user"
        );
      }
      throw err;
    }
  }
  private async exchangeCodeForToken(code: string): Promise<string> {
    const discordRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.configService.getOrThrow("DISCORD_CLIENT_ID"),
        client_secret: this.configService.getOrThrow("DISCORD_CLIENT_SECRET"),
        grant_type: "authorization_code",
        code,
        redirect_uri: this.configService.getOrThrow("DISCORD_REDIRECT_URI"),
      }),
    });
    if (!discordRes.ok) {
      throw new UnauthorizedException(
        "Failed to exchange Discord authorization code"
      );
    }

    const data = (await discordRes.json()) as DiscordTokenResponse;
    return data.access_token;
  }

  private async fetchDiscordUser(
    accessToken: string
  ): Promise<{ id: string; username: string }> {
    const discordRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!discordRes.ok) {
      throw new UnauthorizedException("Failed to fetch Discord user profile");
    }
    return (await discordRes.json()) as DiscordUserResponse;
  }
}
