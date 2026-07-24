import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
// import { UpdateUserDto } from "./dto/update-user.dto";
import { PrismaService } from "src/common/prisma/prisma.service";
import { BcryptService } from "../common/security/bcrypt.service";
import { Role } from "src/generated/prisma/client";
import { Prisma } from "src/generated/prisma/client";
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private bcrypt: BcryptService
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
        passwordHash: passwordHash,
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
        isVerified: true, // Google emails are already verified!
        // Notice we do NOT pass a passwordHash here at all
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
}

// needed by AuthService for login
// async findByEmail(email: string): Promise<User | null>{
//
//
// // needed by AuthService and other services
// async findById(id: string): Promise<User | null>
//
// // needed by email verification flow
// async markAsVerified(id: string): Promise<User>
//
// // needed by reset password flow
// async updatePassword(id: string, passwordHash: string): Promise<User>
//
