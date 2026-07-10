import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BcryptService } from "../common/security/bcrypt.service";

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}
}
