import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../auth.service";
import { Role } from "@/generated/prisma/client";
import { UsersService } from "@/modules/users/users.service";

@Injectable()
export class GoogleAuthService implements OnModuleInit {
  private oauthClient: OAuth2Client;
  constructor(
    private readonly configueService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}
  onModuleInit() {
    const clientId =
      this.configueService.getOrThrow<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configueService.getOrThrow<string>(
      "GOOGLE_CLIENT_SECRET"
    );
    this.oauthClient = new OAuth2Client(clientId, clientSecret);
  }

  async authenticate(token: string) {
    const loginTicket = await this.oauthClient.verifyIdToken({
      audience: this.configueService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      idToken: token,
    });
    const payload = loginTicket.getPayload();
    if (!payload) {
      throw new UnauthorizedException("Invalid Google token payload");
    }
    const {
      email,
      sub: googleId,
      given_name: firstName,
      family_name: lastName,
    } = payload;
    if (!email || !googleId) {
      throw new UnauthorizedException("Google token is missing required data");
    }

    let user = await this.usersService.findGoogleId(googleId);
    if (!user) {
      const existing = await this.usersService.findByEmail(email);
      if (existing) {
        user = await this.usersService.linkGoogleId(existing.id, googleId);
      }
    }

    if (!user) {
      const assignedRole: Role = Role.SRE;
      user = await this.usersService.createWithGoogle(
        email,
        googleId,
        firstName || "Unknown",
        lastName || "Unknown",
        assignedRole
      );
    }
    return this.authService.generateTokens(user);
  }
}
