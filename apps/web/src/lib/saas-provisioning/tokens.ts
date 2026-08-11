import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const BIND_TTL_MS = 2 * 60 * 60 * 1000;

export function issueBindToken(): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(24).toString("base64url");
  return {
    token,
    hash: hashBindToken(token),
    expiresAt: new Date(Date.now() + BIND_TTL_MS).toISOString()
  };
}

export function hashBindToken(token: string): string {
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

export function bindTokenValid(
  job: {
    bindTokenHash: string | null;
    bindExpiresAt: string | null;
  },
  token: string
): boolean {
  if (!job.bindTokenHash || !job.bindExpiresAt) {
    return false;
  }
  if (!token || typeof token !== "string") {
    return false;
  }
  if (Date.now() > Date.parse(job.bindExpiresAt)) {
    return false;
  }
  return hashesEqual(hashBindToken(token), job.bindTokenHash);
}
