import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BcryptService } from "../common/security/bcrypt.service";
import { SignUp } from "./dto/sign-up.dto";
import { SignIn } from "./dto/sign-in.dto";
import { UsersService } from "../users/users.service";
import { Role } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private bcrypt: BcryptService,
    private readonly userService: UsersService
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
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      //TODO genrating jwt and send it back
    };
  }
}
