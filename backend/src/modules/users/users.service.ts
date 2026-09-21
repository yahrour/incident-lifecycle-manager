import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";
import { Role, Prisma } from "@/generated/prisma/client";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateEmailDto } from "./dto/update-email.dto";
import { generateSecureToken, hashToken } from "@/common/utils/token.util";
import { ConfigService } from "@nestjs/config";
import { MailService } from "@/common/mail/mail.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly bcrypt: BcryptService,
    private readonly mailService: MailService
  ) {}

  private normalizeEmail(email: string) {
    return email.toLowerCase();
  }

  async create(
    data: CreateUserDto,
    tx: Prisma.TransactionClient = this.prisma
  ) {
    const { password } = data;
    const email = this.normalizeEmail(data.email);
    const passwordHash = await this.bcrypt.hash(password);
    const existing = await tx.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException("Email already in use");
    }

    return tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        timezone: data.timezone,
        passwordHash,
        role: data.role,
        specialty: data.specialty ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        specialty: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async createWithGoogle(
    email: string,
    googleId: string,
    firstName: string,
    lastName: string,
    role: Role
  ) {
    return this.prisma.user.create({
      data: {
        email: this.normalizeEmail(email),
        googleId,
        firstName: firstName || "Google", // Fallbacks just in case
        lastName: lastName || "User",
        role,
        isVerified: true, // Google emails are already verified
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generating avatar statically from first letter of firstName and lastName
    const avatarInitials =
      `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

    // TODO: add timezone and organizationName to return payload
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarInitials,
      email: user.email,
      role: user.role,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // TODO: validate timezone before storing it if it's provided
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateProfileDto,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });
    } catch (error) {
      // P2025 is Prisma's code for "Record to update not found"
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw error;
    }
  }

  async updateEmail(userId: string, updateEmailDto: UpdateEmailDto) {
    const email = this.normalizeEmail(updateEmailDto.email);
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    // 1. Fast fail: Cannot change to current active email
    if (currentUser.email === email) {
      throw new BadRequestException(
        "New email cannot be the same as current email"
      );
    }

    // 2. Check if the email belongs to another active user
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email address is already in use");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: email },
    });

    await this.createAndSendVerificationToken(
      userId,
      email,
      currentUser.firstName
    );
    return {
      message:
        "Verification email sent. Please check your inbox to confirm the change.",
      pendingEmail: email,
    };
  }

  async createAndSendVerificationToken(
    userId: string,
    email: string,
    name: string
  ) {
    const { rawToken, hashedToken } = generateSecureToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    const verifyUrl = `${this.configService.get("APP_URL")}/api/v1/users/verify-email-change?token=${rawToken}`;
    return this.mailService.sendEmailChangeVerification(email, name, verifyUrl);
  }

  /**
   * Verifies a pending email change using a one-time token sent to the user's new address.
   * On success: marks the token as used and replaces `user.email` with `user.pendingEmail`.
   * Throws NotFoundException/GoneException/ConflictException for invalid/expired/used tokens,
   * or ConflictException if the target email was claimed by someone else in the meantime.
   */
  async verifyEmailChange(token: string) {
    const hashedToken = hashToken(token);
    return this.prisma.$transaction(async (prisma) => {
      const emailToken = await prisma.emailVerificationToken.findUnique({
        where: { token: hashedToken },
        include: { user: { select: { pendingEmail: true } } },
      });

      if (!emailToken) throw new NotFoundException("Invalid verification link");
      if (emailToken.expiresAt < new Date())
        throw new GoneException("This link has expired.");
      if (emailToken.used)
        throw new ConflictException("This link has already been used.");
      if (!emailToken.user.pendingEmail) {
        throw new BadRequestException(
          "No pending email change found for this account"
        );
      }
      await prisma.emailVerificationToken.update({
        where: { id: emailToken.id },
        data: { used: true },
      });
      await prisma.user.update({
        where: { id: emailToken.userId },
        data: { email: emailToken.user.pendingEmail, pendingEmail: null },
      });
      await prisma.refreshToken.deleteMany({
        where: { userId: emailToken.userId },
      });
      return { message: "Email updated successfully" };
    });
  }
}
