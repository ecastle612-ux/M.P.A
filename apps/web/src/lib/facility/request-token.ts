import { createHash, randomBytes } from "node:crypto";

export function generateFacilityRequestToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashFacilityRequestToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function publicTokenPrefix(token: string): string {
  return token.slice(0, 6);
}

export function looksLikeHighEntropyToken(token: string): boolean {
  return (
    typeof token === "string" &&
    token.length >= 24 &&
    /^[A-Za-z0-9_-]+$/.test(token) &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
  );
}
