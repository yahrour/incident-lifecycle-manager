import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../../decorators/public.decorator";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.["accessToken"];
    if (!token) {
      throw new UnauthorizedException("No token found");
    }
    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        secret: this.configService.getOrThrow<string>("JWT_SECRET"),
        audience: this.configService.getOrThrow<string>("JWT_AUDIENCE"),
        issuer: this.configService.getOrThrow<string>("JWT_ISSUER"),
      });

      (request as Request & { user: Record<string, unknown> }).user = payload;
    } catch {
      throw new UnauthorizedException("Token is invalid or expired");
    }
    return true;
  }
}
