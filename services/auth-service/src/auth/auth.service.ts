import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BcryptService } from "../common/security/bcrypt.service";
import { RegisterUserDto } from "./dto/register.dto";
import { UsersService } from "../users/users.service";
import { Role } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private bcrypt: BcryptService,
    private readonly userService: UsersService
  ) {}
  async register(registerUserDto: RegisterUserDto) {
    const sreUserData = {
      ...registerUserDto,
      role: Role.SRE,
    };
    return this.userService.create(sreUserData);
  }
}
