import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";

export function safeRedirect(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/";
}

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    if (req.query.code || req.query.error) return {};

    const redirect = safeRedirect(req.query.redirect);

    return {
      state: redirect,
      prompt: "select_account",
    };
  }

  handleRequest<TUser>(
    error: unknown,
    user: TUser | false
  ): TUser | null {
    return error || !user ? null : user;
  }
}