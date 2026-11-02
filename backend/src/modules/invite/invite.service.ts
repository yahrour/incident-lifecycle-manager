import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
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
    if (currUser.email === createInvite.inviteEmail) {
      throw new BadRequestException("You can't invite yourself to a team.");
    }
    const expiresAt = new Date(
      Date.now() + createInvite.expiresIn * 60 * 60 * 1000
    );
    const { rawToken, hashedToken } = generateSecureToken();
    await this.prisma.$transaction(async (tx) => {
      await tx.inviteToken.deleteMany({
        where: {
          email: createInvite.inviteEmail,
          teamId: createInvite.teamId,
          used: false,
        },
      });
      await tx.inviteToken.create({
        data: {
          token: hashedToken,
          email: createInvite.inviteEmail,
          teamId: createInvite.teamId,
          expiresAt,
        },
      });
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
        const { count } = await tx.inviteToken.updateMany({
          where: { id: invite.id, used: false },
          data: { used: true },
        });
        if (count === 0) {
          throw new ConflictException(
            "This invite link has already been used."
          );
        }
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
        await this.membersService.addToTeam(tx, invite.teamId, newUser.id);
      });
      return {
        success: true,
        message: "Registration successful. Please log in.",
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        "Failed to join the team. Please try again."
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
    if (user.role !== Role.ENGINEER) {
      throw new ForbiddenException("Only engineers can join a team.");
    }
    const isMember = await this.membersService.isInTeam(user.id);
    if (isMember) {
      throw new ConflictException(
        "You're already in a team. Leave it before joining a new one."
      );
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.inviteToken.updateMany({
          where: { id: invite.id, used: false },
          data: { used: true },
        });
        if (count === 0) {
          throw new ConflictException(
            "This invite link has already been used."
          );
        }
        await this.membersService.addToTeam(tx, invite.teamId, activeUser.sub);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
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
    const frontUrl = this.configService.get<string>("FRONTEND_URL");
    const inviteLink = `${frontUrl}/invite?token=${rawToken}`;
    return {
      inviteLink,
    };
  }
}
