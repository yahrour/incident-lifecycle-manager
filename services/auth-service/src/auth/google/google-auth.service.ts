import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../auth.service";
import { UsersService } from "src/users/users.service";

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
    const { email, sub: googleId } = loginTicket.getPayload();
    const user = await this.usersService.findById(googleId);
    if (user) {
      return this.authService.generateTokens(user);
    } else {
      const newUser = await this.usersService.create({ email, googleId });
      return this.authService.generateTokens(user);
    }
  }
}
