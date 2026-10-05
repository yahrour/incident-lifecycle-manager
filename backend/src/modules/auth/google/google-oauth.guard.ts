import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  handleRequest<TUser>(error: unknown, user: TUser | false): TUser | null {
    return error || !user ? null : user;
  }
}
