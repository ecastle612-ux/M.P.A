/**
 * FIN-003 Phase C R-C1 — exclusive execute lease concurrency tests.
 */
import { describe, expect, it } from "vitest";
import {
  computeLeaseExpiryIso,
  decideExecuteLeaseAction,
  EXECUTE_LEASE_TTL_MS,
  isExecuteLeaseExpired,
  simulateSerializedLeaseClaims
} from "./execute-lease";

describe("R-C1 exclusive execute lease", () => {
  it("acquires from idle statuses", () => {
    expect(
      decideExecuteLeaseAction({
        status: "queued",
        leaseExpiresAt: null,
        nowMs: 1_000_000
      })
    ).toBe("acquire");
    expect(
      decideExecuteLeaseAction({
        status: "partial",
        leaseExpiresAt: null,
        nowMs: 1_000_000
      })
    ).toBe("acquire");
    expect(
      decideExecuteLeaseAction({
        status: "failed",
        leaseExpiresAt: null,
        nowMs: 1_000_000
      })
    ).toBe("acquire");
  });

  it("denies live running lease (single execution authority)", () => {
    const now = 5_000_000;
    const expires = computeLeaseExpiryIso(now, EXECUTE_LEASE_TTL_MS);
    expect(
      decideExecuteLeaseAction({
        status: "running",
        leaseExpiresAt: expires,
        nowMs: now + 1_000
      })
    ).toBe("deny");
  });

  it("allows steal only after lease expiry (crash recovery)", () => {
    const started = 1_000_000;
    const expires = computeLeaseExpiryIso(started, 60_000);
    expect(isExecuteLeaseExpired(expires, started + 30_000)).toBe(false);
    expect(isExecuteLeaseExpired(expires, started + 60_001)).toBe(true);
    expect(
      decideExecuteLeaseAction({
        status: "running",
        leaseExpiresAt: expires,
        nowMs: started + 60_001
      })
    ).toBe("steal");
  });

  it("treats null/missing lease on running as expired (legacy recovery)", () => {
    expect(
      decideExecuteLeaseAction({
        status: "running",
        leaseExpiresAt: null,
        nowMs: Date.now()
      })
    ).toBe("steal");
  });

  it("denies terminal statuses", () => {
    expect(
      decideExecuteLeaseAction({
        status: "succeeded",
        leaseExpiresAt: null,
        nowMs: 1
      })
    ).toBe("deny");
    expect(
      decideExecuteLeaseAction({
        status: "draft",
        leaseExpiresAt: null,
        nowMs: 1
      })
    ).toBe("deny");
  });

  it("serialized concurrent acquires: only one winner (no double authority)", () => {
    const results = simulateSerializedLeaseClaims({
      initial: { status: "queued", leaseExpiresAt: null },
      claimers: [{ nowMs: 1000 }, { nowMs: 1001 }, { nowMs: 1002 }],
      ttlMs: 60_000
    });
    expect(results.filter((r) => r.won)).toHaveLength(1);
    expect(results[0]?.won).toBe(true);
    expect(results[0]?.decision).toBe("acquire");
    expect(results[1]?.won).toBe(false);
    expect(results[1]?.decision).toBe("deny");
    expect(results[2]?.won).toBe(false);
  });

  it("serialized concurrent steal on expired lease: only one winner", () => {
    const t0 = 1_000_000;
    const expiredAt = computeLeaseExpiryIso(t0 - 120_000, 60_000); // already expired
    const results = simulateSerializedLeaseClaims({
      initial: { status: "running", leaseExpiresAt: expiredAt },
      claimers: [
        { nowMs: t0 },
        { nowMs: t0 + 1 },
        { nowMs: t0 + 2 }
      ],
      ttlMs: 60_000
    });
    expect(results[0]?.decision).toBe("steal");
    expect(results[0]?.won).toBe(true);
    expect(results.filter((r) => r.won)).toHaveLength(1);
    expect(results[1]?.decision).toBe("deny");
    expect(results[2]?.decision).toBe("deny");
  });

  it("cannot steal while lease is live — prevents parallel overpay window", () => {
    const t0 = 2_000_000;
    const liveExpiry = computeLeaseExpiryIso(t0, 300_000);
    const results = simulateSerializedLeaseClaims({
      initial: { status: "running", leaseExpiresAt: liveExpiry },
      claimers: [{ nowMs: t0 + 1_000 }, { nowMs: t0 + 2_000 }],
      ttlMs: 300_000
    });
    expect(results.every((r) => !r.won && r.decision === "deny")).toBe(true);
  });

  it("after crash expiry, recovery steal then blocks peers", () => {
    const crashAt = 3_000_000;
    const expired = computeLeaseExpiryIso(crashAt - 400_000, 60_000);
    const recovery = simulateSerializedLeaseClaims({
      initial: { status: "running", leaseExpiresAt: expired },
      claimers: [{ nowMs: crashAt }, { nowMs: crashAt + 10 }],
      ttlMs: 120_000
    });
    expect(recovery[0]?.won).toBe(true);
    expect(recovery[1]?.won).toBe(false);
  });
});
