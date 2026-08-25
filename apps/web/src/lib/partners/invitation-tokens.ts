import { PARTNER_INVITATION_TTL_MS } from "@mpa/shared";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function issuePartnerInvitationToken(): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(24).toString("base64url");
  return {
    token,
    hash: hashPartnerInvitationToken(token),
    expiresAt: new Date(Date.now() + PARTNER_INVITATION_TTL_MS).toISOString()
  };
}

export function hashPartnerInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function partnerInvitationTokenLooksValid(token: string): boolean {
  return typeof token === "string" && token.length >= 24 && token.length <= 64 && !token.includes("/");
}

export function partnerInvitationTokenMatches(hash: string, token: string): boolean {
  if (!hash || !partnerInvitationTokenLooksValid(token)) {
    return false;
  }
  return hashesEqual(hashPartnerInvitationToken(token), hash);
}
