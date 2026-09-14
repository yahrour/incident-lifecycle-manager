import type { CookieOptions } from "express";

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  path: "/api",
  maxAge: 15 * 60 * 1000,
};

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  path: "/api/v1/auth",
  maxAge: 24 * 60 * 60 * 1000,
};
