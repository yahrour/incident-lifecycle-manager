import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile } from "passport-google-oauth20";

export type GoogleProfile = {
  googleId: string;
  email: string | undefined;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile
  ): GoogleProfile {
    const email = profile.emails?.[0];
    return {
      googleId: profile.id,
      email: email?.value.toLowerCase(),
      emailVerified: email?.verified === true,
      firstName: profile.name?.givenName ?? "Unknown",
      lastName: profile.name?.familyName ?? "Unknown",
    };
  }
}
