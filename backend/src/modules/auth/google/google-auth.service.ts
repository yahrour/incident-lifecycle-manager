// google-auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Role } from "@/generated/prisma/client";
import { UsersService } from "@/modules/users/users.service";
import type { GoogleProfile } from "./google.strategy";

@Injectable()
export class GoogleAuthService {
  constructor(private readonly usersService: UsersService) {}

  async findOrCreateUser(profile: GoogleProfile) {
    if (!profile.email || !profile.emailVerified) {
      throw new UnauthorizedException("Google account email is not verified");
    }

    const byGoogleId = await this.usersService.findGoogleId(profile.googleId);
    if (byGoogleId) return byGoogleId;

    const byEmail = await this.usersService.findByEmail(profile.email);
    if (byEmail) {
      return this.usersService.linkGoogleId(byEmail.id, profile.googleId);
    }

    return this.usersService.createWithGoogle(
      profile.email,
      profile.googleId,
      profile.firstName,
      profile.lastName,
      Role.SRE
    );
  }
}
