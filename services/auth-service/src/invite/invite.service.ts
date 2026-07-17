import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateInvite } from "./dto/create-invite.dto";
import { UsersService } from "src/users/users.service";
import * as crypto from "crypto";
import { RegisterViaInviteDto } from "./dto/register-via-invite.dto";
import { Role } from "@prisma/client";
import { ActiveUserData } from "src/common/interfaces/active-user.interface";

@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    private readonly userService: UsersService
  ) {}
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
      await this.prisma.inviteToken.update({
        where: { id: existingInvite.id },
        data: { used: true },
      });
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

  async validateToken(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const invite = await this.prisma.inviteToken.findFirst({
      where: { token: hashedToken },
    });

    if (!invite) {
      throw new NotFoundException("Invalid invite link.");
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException(
        "This invite link has expired. Please request a new one."
      );
    }
    if (invite.used) {
      throw new BadRequestException("This invite link has already been used.");
    }

    const user = await this.userService.findByEmail(invite.email);
    //return the front-end to be used if foweard to login page needed
    return {
      email: invite.email,
      isAlreadyRegistered: !!user,
    };
  }

  async register(registerViaInviteDto: RegisterViaInviteDto) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(registerViaInviteDto.token)
      .digest("hex");
    const invite = await this.prisma.inviteToken.findFirst({
      where: { token: hashedToken },
    });

    if (!invite) {
      throw new NotFoundException("Invalid invite link.");
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException(
        "This invite link has expired. Please request a new one."
      );
    }
    if (invite.used) {
      throw new BadRequestException("This invite link has already been used.");
    }
    const engineerData = {
      email: invite.email,
      firstName: registerViaInviteDto.firstName,
      lastName: registerViaInviteDto.lastName,
      password: registerViaInviteDto.password,
      specialty: registerViaInviteDto.specialty,
      role: Role.ENGINEER,
    };

    const newUser = await this.userService.create(engineerData);
    //TODO: comminicate with team service await this.teamService.addUserToTeam(newUser.id, invite.teamId);

    await this.prisma.inviteToken.update({
      where: { id: invite.id },
      data: { used: true },
    });
    return { success: true, message: "Registration successful" };
  }
  async accept(token: string, activeUser: ActiveUserData) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const invite = await this.prisma.inviteToken.findFirst({
      where: { token: hashedToken },
    });

    if (!invite) {
      throw new NotFoundException("Invalid invite link.");
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException("This invite link has expired.");
    }
    if (invite.used) {
      throw new BadRequestException("This invite link has already been used.");
    }
    if (invite.email !== activeUser.email) {
      throw new ForbiddenException(
        "You can only accept invites sent to your registered email address."
      );
    }
    //TODO: cehck if already in team to regect and put as used token
    //TODO if not add them to a team and make the token as used
  }
}
