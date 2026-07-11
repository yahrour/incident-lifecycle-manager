import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.["accessToken"];
    if (!token) {
      throw new UnauthorizedException("No token found");
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request["user"] = payload;
      console.log(payload);
    } catch {
      throw new UnauthorizedException("Token is invalid or expired");
    }

    return true;
  }
}
