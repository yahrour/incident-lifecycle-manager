import { Injectable } from "@nestjs/common";
import { Role } from "@/generated/prisma/client";
import { UsersService } from "@/modules/users/users.service";
import type { GoogleProfile } from "./google.strategy";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  async login(profile: GoogleProfile) {
    if (!profile.email || !profile.emailVerified) {
      return {
        success: false as const,
        message: "Google email is not verified",
      };
    }
    const user = await this.findOrCreateUser(profile, profile.email);
    const tokens = await this.authService.generateTokens(user);
    return { success: true as const, ...tokens };
  }

  private async findOrCreateUser(profile: GoogleProfile, email: string) {
    const byGoogleId = await this.usersService.findGoogleId(profile.googleId);
    if (byGoogleId) return byGoogleId;

    const byEmail = await this.usersService.findByEmail(email);
    if (byEmail) {
      return this.usersService.linkGoogleId(byEmail.id, profile.googleId);
    }

    return this.usersService.createWithGoogle(
      email,
      profile.googleId,
      profile.firstName,
      profile.lastName,
      Role.SRE
    );
  }
}
