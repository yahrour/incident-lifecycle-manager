import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { BcryptService } from "../auth/bcrypt.service";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private bcrypt: BcryptService
  ) {}

  async create(data: CreateUserDto) {
    const { password } = data;
    const passwordHash = await this.bcrypt.hash(password);
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException("Email already in use");
    }
    return this.prisma.user.create({
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
