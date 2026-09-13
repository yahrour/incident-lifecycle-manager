import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateInvite } from "./dto/create-invite.dto";
import * as crypto from "crypto";

@Injectable()
export class InviteService {
  constructor(private prisma: PrismaService) {}
  async createInvite(createInvite: CreateInvite) {
    const existingInvite = await this.prisma.inviteToken.findFirst({
      where: {
        email: createInvite.inviteEmail,
        teamId: createInvite.teamId,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      throw new ConflictException(
        "An active invite already exists for this email"
      );
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + createInvite.expiresIn);

    await this.prisma.inviteToken.create({
      data: {
        token: hashedToken,
        email: createInvite.inviteEmail,
        teamId: createInvite.teamId,
        expiresAt: expiresAt,
        used: false,
      },
    });
    // TODO: send email with rawToken
    // await this.mailService.sendInviteEmail(
    //   createInviteDto.inviteEmail,
    //   rawToken
    // );

    return { success: true };
  }
}
