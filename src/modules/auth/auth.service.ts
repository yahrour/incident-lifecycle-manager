import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
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
import { generateSecureToken, hashToken } from "@/common/utils/token.util";
import { PrismaService } from "@/common/prisma/prisma.service";
import { MailService } from "@/common/mail/mail.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly bcrypt: BcryptService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}
  async signUp(signUp: SignUp) {
    const sreUserData = {
      ...signUp,
      role: Role.SRE,
    };

    /**
     * User and verification-token creation are wrapped in a transaction so an
     * account is never created without a corresponding token. Email sending is
     * intentionally kept outside the transaction — an SMTP failure shouldn't
     * roll back a valid signup, just leave a resendable unsent token.
     */
    const { user, rawToken } = await this.prisma.$transaction(
      async (prisma) => {
        const user = await this.userService.create(sreUserData, prisma);
        const { rawToken, hashedToken } = generateSecureToken();

        await prisma.emailVerificationToken.create({
          data: {
            token: hashedToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          },
        });
        return { user, rawToken };
      }
    );
    const verifyUrl = `${this.configService.get("APP_URL")}/api/v1/auth/verify-email?token=${rawToken}`;
    await this.mailService.sendEmailVerification(
      user.email,
      user.firstName,
      verifyUrl
    );
    return {
      message:
        "Account created. Please check your email to verify your account.",
    };
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
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  /**
   * Verifies a newly registered account using a one-time token sent to the user's email on signup.
   * On success: marks the token as used and sets `user.isVerified` to true.
   * Throws NotFoundException/GoneException/ConflictException for invalid/expired/used tokens,
   * or ConflictException if the account was already verified.
   */
  async verifySignupEmail(token: string) {
    const hashedToken = hashToken(token);
    return this.prisma.$transaction(async (prisma) => {
      const emailToken = await prisma.emailVerificationToken.findUnique({
        where: { token: hashedToken },
        include: { user: { select: { isVerified: true } } },
      });

      if (!emailToken) throw new NotFoundException("Invalid verification link");
      if (emailToken.expiresAt < new Date())
        throw new GoneException("This link has expired.");

      if (emailToken.used)
        throw new ConflictException("This link has already been used.");
      if (emailToken.user.isVerified)
        throw new ConflictException("This account is already verified");

      await prisma.emailVerificationToken.update({
        where: { id: emailToken.id },
        data: { used: true },
      });
      await prisma.user.update({
        where: { id: emailToken.userId },
        data: { isVerified: true },
      });
      return { message: "Email verified successfully" };
    });
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        await this.prisma.refreshToken.deleteMany({
          where: { tokenHash: hashToken(refreshToken) },
        });
      } catch (error) {
        console.error("Failed to revoke refresh token on logout:", error);
      }
    }
    return { message: "Logged out successfully" };
  }

  async requestPasswordReset(email: string) {
    // const start = Date.now();
    const user = await this.userService.findByEmail(email);

    if (user) {
      const { rawToken, hashedToken } = generateSecureToken();
      await this.prisma.resetToken.create({
        data: {
          token: hashedToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      });

      const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${rawToken}`;

      try {
        await this.mailService.sendPasswordReset(
          user.email,
          user.firstName,
          resetUrl
        );
      } catch (error) {
        // this.logger.error("Failed to send password reset email", error); // at least log it
        console.log(error);
      }
    }

    // await this.padToMinimumDuration(start, 500);

    return { message: "If that email exists, a reset link has been sent." };
  }
}
