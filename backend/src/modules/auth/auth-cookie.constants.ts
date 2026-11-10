export const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const accessCookieOptions = (ttlSeconds: number) => ({
  ...baseCookie,
  maxAge: ttlSeconds * 1000,
});

export const refreshCookieOptions = (ttlSeconds: number) => ({
  ...baseCookie,
  maxAge: ttlSeconds * 1000,
});
import type { Response } from "express";
import type { ConfigService } from "@nestjs/config";

export function setAuthCookies(
  response: Response,
  tokens: { accessToken: string; refreshToken: string },
  config: ConfigService
) {
  const accessTtl = config.getOrThrow<number>("JWT_ACCESS_TOKEN_TTL");
  const refreshTtl = config.getOrThrow<number>("JWT_REFRESH_TOKEN_TTL");
  response.cookie(
    "accessToken",
    tokens.accessToken,
    accessCookieOptions(accessTtl)
  );
  response.cookie(
    "refreshToken",
    tokens.refreshToken,
    refreshCookieOptions(refreshTtl)
  );
}
