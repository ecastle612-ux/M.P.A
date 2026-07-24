/**
 * PAY-001 application fee policy (binding).
 * fee_cents = min(charge_amount, max(0, round(bps) + flat)); never negative; never exceed charge.
 */

export function computeApplicationFeeAmountCents(input: {
  chargeAmountCents: number;
  feeBps: number;
  feeFlatCents: number;
}): number {
  const charge = Math.max(0, Math.trunc(input.chargeAmountCents));
  const bps = Math.max(0, Math.trunc(input.feeBps));
  const flat = Math.max(0, Math.trunc(input.feeFlatCents));
  if (charge <= 0) return 0;
  const fromBps = Math.round((charge * bps) / 10_000);
  const raw = fromBps + flat;
  return Math.min(charge, Math.max(0, raw));
}
