import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { CreateInvite } from "./dto/create-invite.dto";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { RegisterViaInviteDto } from "./dto/register-via-invite.dto";
import { Role, InviteToken } from "src/generated/prisma/client";
import { ActiveUserData } from "../common/interfaces/active-user.interface";

@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Public Methods ───────────────────────────────────────────────

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
      await this.prisma.inviteToken.delete({
        where: { id: existingInvite.id },
      });
    }

    // generate new token
    const { rawToken, hashedToken } = this.generateToken();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + createInvite.expiresIn);

    await this.prisma.inviteToken.create({
      data: {
        token: hashedToken,
        email: createInvite.inviteEmail,
        teamId: createInvite.teamId,
        expiresAt,
        used: false,
      },
    });

    return this.buildInviteLinkResponse(rawToken);
  }

  async validateToken(token: string) {
    const invite = await this.findAndValidateToken(token);
    const user = await this.userService.findByEmail(invite.email);

    return {
      email: invite.email,
      isAlreadyRegistered: !!user,
    };
  }

  async register(registerViaInviteDto: RegisterViaInviteDto) {
    const invite = await this.findAndValidateToken(registerViaInviteDto.token);

    const existingUser = await this.userService.findByEmail(invite.email);
    if (existingUser) {
      throw new ConflictException(
        "This email is already registered. Please use the login flow.",
      );
    }

    const newUser = await this.userService.create({
      email: invite.email,
      firstName: registerViaInviteDto.firstName,
      lastName: registerViaInviteDto.lastName,
      password: registerViaInviteDto.password,
      specialty: registerViaInviteDto.specialty,
      role: Role.ENGINEER,
    });

    try {
      // TODO: call Team Service to add member
      // await this.httpService.axiosRef.post(
      //   'http://team-service:3002/internal/members',
      //   { userId: newUser.id, teamId: invite.teamId }
      // );
    } catch {
      await this.userService.deleteUser(newUser.id);
      throw new InternalServerErrorException(
        "Failed to add engineer to team. Please try again.",
      );
    }
    await this.markTokenAsUsed(invite.id);

    return { success: true, message: "Registration successful. Please login." };
  }

  async accept(token: string, activeUser: ActiveUserData) {
    const invite = await this.findAndValidateToken(token);

    if (invite.email !== activeUser.email) {
      throw new ForbiddenException(
        "You can only accept invites sent to your registered email address.",
      );
    }

    // TODO: ask Team Service if engineer already belongs to a team
    // if yes → throw ConflictException, do NOT mark token as used
    // if no  → add to team → mark token as used

    await this.markTokenAsUsed(invite.id);

    return { success: true, message: "You have successfully joined the team." };
  }

  private generateToken() {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    return { rawToken, hashedToken };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  private async findAndValidateToken(rawToken: string): Promise<InviteToken> {
    const hashedToken = this.hashToken(rawToken);

    const invite = await this.prisma.inviteToken.findUnique({
      where: { token: hashedToken },
    });

    if (!invite) {
      throw new NotFoundException("Invalid invite link.");
    }
    if (invite.expiresAt < new Date()) {
      throw new GoneException(
        "This invite link has expired. Please request a new one.",
      );
    }
    if (invite.used) {
      throw new ConflictException("This invite link has already been used.");
    }
    return invite;
  }

  private async markTokenAsUsed(inviteId: string): Promise<void> {
    await this.prisma.inviteToken.update({
      where: { id: inviteId },
      data: { used: true },
    });
  }

  private buildInviteLinkResponse(rawToken: string) {
    const appUrl = this.configService.get<string>("APP_URL");
    const inviteLink = `${appUrl}/register?token=${rawToken}`;
    return {
      success: true,
      inviteLink,
    };
  }
}
