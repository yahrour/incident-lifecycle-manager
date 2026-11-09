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
