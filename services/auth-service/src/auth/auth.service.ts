import { Injectable, UnauthorizedException } from "@nestjs/common";
import { BcryptService } from "../common/security/bcrypt.service";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { UsersService } from "../users/users.service";
import { Role } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config"; //
import { ActiveUserData } from "src/common/interfaces/active-user.interface";

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
    const isMatch = await this.bcrypt.compare(
      signIn.password,
      user.passwordHash
    );

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      } as ActiveUserData,
      {
        audience: this.configService.get("JWT_AUDIENCE"),
        issuer: this.configService.get("JWT_ISSUER"),
      }
    );

    return {
      accessToken: token,
      expiresIn: this.configService.get("JWT_EXPIRES_IN"),
    };
  }
}
