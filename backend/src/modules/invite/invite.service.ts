import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@/common/prisma/prisma.service";
import { CreateInvite } from "./dto/create-invite.dto";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import { RegisterViaInviteDto } from "./dto/register-via-invite.dto";
import { Role, InviteToken } from "@/generated/prisma/client";
import { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { MembersService } from "../organization/members/members.service";
import { hashToken, generateSecureToken } from "@/common/utils/token.util";

@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly membersService: MembersService
  ) {}

  // ─── Public Methods ───────────────────────────────────────────────

  async createInvite(createInvite: CreateInvite, activeUser: ActiveUserData) {
    const currUser = await this.userService.findById(activeUser.sub);
    if (!currUser) {
      throw new NotFoundException("User not found");
    }
    if (currUser.email.toLowerCase() === createInvite.inviteEmail) {
      throw new BadRequestException("You can't invite yourself to a team.");
    }
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
    const { rawToken, hashedToken } = generateSecureToken();

    const inviteTtlDays = this.configService.getOrThrow<number>(
      "INVITE_TOKEN_TTL_DAYS"
    );

    await this.prisma.inviteToken.create({
      data: {
        token: hashedToken,
        email: createInvite.inviteEmail,
        teamId: createInvite.teamId,
        expiresAt: new Date(Date.now() + inviteTtlDays * 24 * 60 * 60 * 1000),
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
        "This email is already registered. Please use the login flow."
      );
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        // 2. Create the user (passing 'tx' as the second argument)
        const newUser = await this.userService.create(
          {
            email: invite.email,
            firstName: registerViaInviteDto.firstName,
            lastName: registerViaInviteDto.lastName,
            password: registerViaInviteDto.password,
            timezone: registerViaInviteDto.timezone,
            specialty: registerViaInviteDto.specialty,
            role: Role.ENGINEER,
          },
          tx
        );

        // 3. Add the user to the team
        await this.membersService.add(tx, invite.teamId, newUser.id);

        // 4. Mark the token as used IN THE SAME TRANSACTION
        // the user and team assignment are rolled back too!
        await tx.inviteToken.update({
          where: { id: invite.id },
          data: { used: true },
        });
      });

      return {
        success: true,
        message: "Registration successful. Please login.",
      };
    } catch {
      throw new InternalServerErrorException(
        "Failed to complete registration and team assignment. Please try again."
      );
    }
  }

  async accept(token: string, activeUser: ActiveUserData) {
    const invite = await this.findAndValidateToken(token);

    const user = await this.userService.findById(activeUser.sub);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (invite.email !== user.email) {
      throw new ForbiddenException(
        "You can only accept invites sent to your registered email address."
      );
    }

    try {
      // OPEN THE TRANSACTION BUBBLE
      await this.prisma.$transaction(async (tx) => {
        // 1. Add them to the team (Pass 'tx')
        await this.membersService.add(tx, invite.teamId, activeUser.sub);

        // 2. Mark the token as used (Use 'tx' instead of this.prisma)
        await tx.inviteToken.update({
          where: { id: invite.id },
          data: { used: true },
        });
      });

      return { success: true, message: "Successfully joined the team!" };
    } catch {
      throw new InternalServerErrorException(
        "Failed to join the team. Please try again."
      );
    }
  }
  private async findAndValidateToken(rawToken: string): Promise<InviteToken> {
    const hashedToken = hashToken(rawToken);

    const invite = await this.prisma.inviteToken.findUnique({
      where: { token: hashedToken },
    });

    if (!invite) {
      throw new NotFoundException("Invalid invite link.");
    }
    if (invite.expiresAt < new Date()) {
      throw new GoneException(
        "This invite link has expired. Please request a new one."
      );
    }
    if (invite.used) {
      throw new ConflictException("This invite link has already been used.");
    }
    return invite;
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
