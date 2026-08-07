import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { BcryptService } from "../security/bcrypt.service";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { UsersService } from "../users/users.service";
import { Role, User } from "@/generated/prisma/client";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config"; //
import { ActiveUserData } from "@/common/interfaces/active-user.interface";

@Injectable()
export class AuthService {
  constructor(
    private bcrypt: BcryptService,
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}
  async signUp(signUp: SignUp) {
    const sreUserData = {
      ...signUp,
      role: Role.SRE,
    };
    return this.userService.create(sreUserData);
  }

  async signIn(signIn: SignIn) {
    const user = await this.userService.findByEmail(signIn.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        "This account was created with Google. Please sign in with Google."
      );
    }
    const isMatch = await this.bcrypt.compare(
      signIn.password,
      user.passwordHash
    );

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (!user.isVerified) {
      throw new ForbiddenException(
        "Please verify your email before logging in"
      );
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const accessTtl = this.configService.getOrThrow<number>(
      "JWT_ACCESS_TOKEN_TTL"
    );
    const refreshTtl = this.configService.getOrThrow<number>(
      "JWT_REFRESH_TOKEN_TTL"
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        accessTtl,
        this.configService.getOrThrow<string>("JWT_SECRET"),
        { email: user.email, role: user.role }
      ),
      this.signToken(
        user.id,
        refreshTtl,
        this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
  private async signToken<T>(
    userId: string,
    expiresIn: number,
    secret: string,
    payload?: T
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.configService.get("JWT_AUDIENCE"),
        issuer: this.configService.get("JWT_ISSUER"),
        secret,
        expiresIn,
      }
    );
  }

  async refrechTokens(refrechToken: string) {
    try {
      const { sub } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, "sub">
      >(refrechToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        audience: this.configService.getOrThrow<string>("JWT_AUDIENCE"),
        issuer: this.configService.getOrThrow<string>("JWT_ISSUER"),
      });

      const user = await this.userService.findById(sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
