import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";
import { Role, Prisma } from "@/generated/prisma/client";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateEmailDto } from "./dto/update-email.dto";
import { generateSecureToken } from "@/common/utils/token.util";
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

  async create(
    data: CreateUserDto,
    tx: Prisma.TransactionClient = this.prisma
  ) {
    const { password } = data;
    const passwordHash = await this.bcrypt.hash(password);
    const existing = await tx.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException("Email already in use");
    }

    return tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
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
        email,
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
      where: { email },
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

  async updateEmail(
    userId: string,
    userEmail: string,
    updateEmailDto: UpdateEmailDto
  ) {
    // 1. Fast fail: Cannot change to current active email
    if (userEmail === updateEmailDto.email) {
      throw new BadRequestException(
        "New email cannot be the same as current email"
      );
    }

    // 2. Check if the email belongs to another active user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: updateEmailDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email address is already in use");
    }

    // 3. Update pendingEmail with error handling for missing user
    let updatedUser: { firstName: string };
    try {
      updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { pendingEmail: updateEmailDto.email },
        select: { firstName: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw error;
    }

    await this.createAndSendVerificationToken(
      userId,
      updateEmailDto.email,
      updatedUser.firstName
    );
    return {
      message:
        "Verification email sent. Please check your inbox to confirm the change.",
      pendingEmail: updateEmailDto.email,
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
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });
    const verifyUrl = `${this.configService.get("APP_URL")}/users/verify-email-change?token=${rawToken}`;
    return this.mailService.sendEmailChangeVerification(email, name, verifyUrl);
  }
}
