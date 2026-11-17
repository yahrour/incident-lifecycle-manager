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
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: ActiveUserData }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        "Authentication required to access this resource"
      );
    }

    // 3. Check if the user's role matches the required roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        "You do not have permission to access this resource."
      );
    }
    return true;
  }
}
