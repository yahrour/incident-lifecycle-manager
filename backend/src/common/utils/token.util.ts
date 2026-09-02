import * as crypto from "crypto";

export function generateSecureToken(bytes = 32) {
  const rawToken = crypto.randomBytes(bytes).toString("hex");
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
