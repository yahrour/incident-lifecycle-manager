import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { BcryptService } from "../security/bcrypt.service";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { UsersService } from "../users/users.service";
import { Role, User } from "@/generated/prisma/client";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config"; //
import { ActiveUserData } from "@/common/interfaces/active-user.interface";
import { hashToken } from "@/common/utils/token.util";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly bcrypt: BcryptService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}
  async signUp(signUp: SignUp) {
    const sreUserData = {
      ...signUp,
      role: Role.SRE,
    };

    await this.userService.create(sreUserData);

    return {
      message: "Account created successfully.",
    };
  }

  async signIn(signIn: SignIn) {
    const user = await this.userService.findByEmail(signIn.email);
    if (!user) {
      return { success: false as const, message: "Invalid credentials" };
    }

    if (!user.passwordHash) {
      return {
        success: false as const,
        message:
          "This account was created with Google. Please sign in with Google.",
      };
    }

    const isMatch = await this.bcrypt.compare(
      signIn.password,
      user.passwordHash
    );

    if (!isMatch) {
      return { success: false as const, message: "Invalid credentials" };
    }

    const tokens = await this.generateTokens(user);
    return { success: true as const, ...tokens };
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
        { role: user.role }
      ),
      this.signToken(
        user.id,
        refreshTtl,
        this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
      ),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

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

      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: hashToken(refrechToken) },
      });
      if (!stored) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }
      const user = await this.userService.findById(sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      const tokens = await this.generateTokens(user);
      return { ...tokens, userId: user.id };
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        await this.prisma.refreshToken.deleteMany({
          where: { tokenHash: hashToken(refreshToken) },
        });
      } catch (error) {
        this.logger.error("Failed to revoke refresh token on logout:", error);
      }
    }
    return { message: "Logged out successfully" };
  }
}
