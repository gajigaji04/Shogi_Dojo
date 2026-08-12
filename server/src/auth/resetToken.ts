import { randomBytes, createHash } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashResetToken(rawToken) };
}

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
