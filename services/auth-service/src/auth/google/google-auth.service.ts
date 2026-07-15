import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../auth.service";
import { UsersService } from "src/users/users.service";
import { Role } from "@prisma/client";

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

  async authentificate(token: string) {
    const loginTicket = await this.oauthClient.verifyIdToken({
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
      let assignedRole: Role = Role.SRE;
      //Todo:
      //
      // if (inviteToken) {
      // Assuming you have an InvitesService that checks the DB for this token
      // const inviteRecord =
      //   await this.invitesService.validateInvite(inviteToken);
      //
      // if (!inviteRecord) {
      //   throw new UnauthorizedException("Invalid or expired invite link");
      // }

      // assignedRole = inviteRecord.role; // e.g., 'ENGINEER'

      // Optional: mark the invite as used here!
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
