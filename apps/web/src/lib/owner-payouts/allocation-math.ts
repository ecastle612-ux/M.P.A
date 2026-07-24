/**
 * FIN-003 Phase C — pure allocation math (R13 rounding + remainder).
 */

export type AllocationShareInput = {
  ownerUserId: string;
  percent: number;
};

export type AllocationShareResult = {
  ownerUserId: string;
  percent: number;
  amountCents: number;
};

/** Banker's rounding (half to even) to integer cents. */
export function roundHalfEvenToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const floor = Math.floor(abs);
  const frac = abs - floor;
  if (frac < 0.5) return sign * floor;
  if (frac > 0.5) return sign * (floor + 1);
  // exactly .5 → nearest even
  return sign * (floor % 2 === 0 ? floor : floor + 1);
}

/**
 * Split property_distributable_cents across owners by percent.
 * Remainder cents go to largest fractional remainder; tie → lowest ownerUserId.
 */
export function allocatePropertyCents(input: {
  propertyDistributableCents: number;
  shares: AllocationShareInput[];
}): AllocationShareResult[] {
  const { propertyDistributableCents, shares } = input;
  if (propertyDistributableCents < 0) {
    throw new Error("propertyDistributableCents must be >= 0");
  }
  if (shares.length === 0) return [];

  const percentSum = shares.reduce((s, x) => s + x.percent, 0);
  if (Math.abs(percentSum - 100) > 0.0001) {
    throw new Error(`Allocation percents must sum to 100 (got ${percentSum})`);
  }

  const exact = shares.map((share) => {
    const raw = (propertyDistributableCents * share.percent) / 100;
    const rounded = roundHalfEvenToCents(raw);
    return {
      ownerUserId: share.ownerUserId,
      percent: share.percent,
      amountCents: rounded,
      remainder: raw - rounded
    };
  });

  const assigned = exact.reduce((s, x) => s + x.amountCents, 0);
  let delta = propertyDistributableCents - assigned;

  const order = [...exact].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.ownerUserId.localeCompare(b.ownerUserId);
  });

  let i = 0;
  while (delta !== 0 && order.length > 0) {
    const target = order[i % order.length]!;
    if (delta > 0) {
      target.amountCents += 1;
      delta -= 1;
    } else if (target.amountCents > 0) {
      target.amountCents -= 1;
      delta += 1;
    } else {
      i += 1;
      if (i > order.length * 3) break;
      continue;
    }
    i += 1;
  }

  return exact.map((x) => ({
    ownerUserId: x.ownerUserId,
    percent: x.percent,
    amountCents: x.amountCents
  }));
}

export function assertProfilePercentsValid(percents: number[]): void {
  if (percents.length === 0) throw new Error("Allocation profile empty");
  const sum = percents.reduce((s, p) => s + p, 0);
  if (Math.abs(sum - 100) > 0.0001) {
    throw new Error(`Allocation percents must sum to 100 (got ${sum})`);
  }
  for (const p of percents) {
    if (!(p > 0 && p <= 100)) throw new Error(`Invalid allocation percent: ${p}`);
  }
}
