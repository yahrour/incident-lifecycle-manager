import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@/generated/prisma/client";
import { ActiveUserData } from "../interfaces/active-user.interface";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check for required roles on the handler (or controller class)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, let them pass
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: ActiveUserData }>();
    const user = request.user;

    // 2. If the user object is missing entirely (failsafe check)
    if (!user) {
      throw new UnauthorizedException(
        "Authentication required to access this resource"
      );
    }

    // 3. Check if the user's role matches the required roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(", ")}]. Your role: ${user.role}`
      );
    }
    return true;
  }
}
