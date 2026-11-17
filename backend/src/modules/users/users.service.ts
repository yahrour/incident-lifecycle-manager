import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BcryptService } from "../security/bcrypt.service";
import { Role, Prisma } from "@/generated/prisma/client";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { OnCallService } from "../on-call/on-call.service";
import { UnavailabilityService } from "../organization/unavailability/unavailability.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly onCall: OnCallService,
    private readonly unavailability: UnavailabilityService
  ) {}

  async create(
    data: CreateUserDto,
    tx: Prisma.TransactionClient = this.prisma
  ) {
    const existing = await tx.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException("Email already in use");
    }
    const { password } = data;
    const passwordHash = await this.bcrypt.hash(password);

    return tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        timezone: data.timezone,
        passwordHash,
        role: data.role,
        specialty: data.specialty ?? null,
      },
      select: {
        id: true,
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
  linkGoogleId(userId: string, googleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        timezone: true,
        specialty: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generating avatar statically from first letter of firstName and lastName
    const avatarInitials =
      `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
      specialty: user.specialty,
      avatarInitials,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
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
          timezone: true,
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

  async getMyOnCallStatus(userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        userId,
      },
    });

    if (!member) {
      return {
        isOnCall: false,
        currentShift: null,
      };
    }

    return await this.onCall.getUserOnCallStatus(member.teamId, userId);
  }

  async getMyMembership(userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return (
      membership && {
        memberId: membership.id,
        team: {
          id: membership.team.id,
          name: membership.team.name,
        },
      }
    );
  }

  async getMyTeam(userId: string) {
    const membership = await this.getMyMembership(userId);
    if (!membership) {
      return null;
    }

    try {
      const [teamDetails, teamUpcomingRotations, teammatesAway] =
        await Promise.all([
          this.prisma.team.findUnique({
            where: {
              id: membership.team.id,
            },
            select: {
              id: true,
              description: true,
              escalationTimeoutMinutes: true,
              name: true,
              rotationPeriodDays: true,
              services: true,
              _count: {
                select: {
                  teamMembers: true,
                },
              },
              teamMembers: {
                take: 5,
                select: {
                  id: true,
                  joinedAt: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      specialty: true,
                    },
                  },
                },
                orderBy: {
                  joinedAt: "desc",
                },
              },
            },
          }),
          this.onCall.getUpcomingRotations(userId, membership.team.id),
          this.unavailability.findTeammatesAway(userId, membership.team.id),
        ]);

      if (!teamDetails) {
        return null;
      }

      const { teamMembers, _count, ...team } = teamDetails;
      return {
        team,
        members: teamMembers,
        membersCount: _count.teamMembers,
        teamUpcomingRotations,
        teammatesAway,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }
}
