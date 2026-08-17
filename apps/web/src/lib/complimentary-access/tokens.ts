import { COMPLIMENTARY_CLAIM_TTL_MS } from "@mpa/shared";
import { hashBindToken } from "../saas-provisioning/tokens";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function issueComplimentaryClaimToken(): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(24).toString("base64url");
  return {
    token,
    hash: hashBindToken(token),
    expiresAt: new Date(Date.now() + COMPLIMENTARY_CLAIM_TTL_MS).toISOString()
  };
}

export function hashComplimentaryClaimToken(token: string): string {
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

export function complimentaryClaimTokenValid(
  grant: { claimTokenHash: string | null; claimExpiresAt: string | null },
  token: string
): boolean {
  if (!grant.claimTokenHash || !grant.claimExpiresAt) {
    return false;
  }
  if (!token || typeof token !== "string") {
    return false;
  }
  if (Date.now() > Date.parse(grant.claimExpiresAt)) {
    return false;
  }
  return hashesEqual(hashComplimentaryClaimToken(token), grant.claimTokenHash);
}
