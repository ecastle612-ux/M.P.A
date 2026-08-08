import {
  COM_002_FLAGS,
  SAAS_PRICE_ENV_KEYS,
  getSelfServeSaasOffers,
  validateSaasCheckoutRequest
} from "@mpa/shared";
import {
  isSaasCheckoutReady,
  isSaasStripeConfigured,
  resolveSaasPriceId
} from "../../lib/saas-stripe/client";
import { listSaasPurchases, listSaasWebhookEvents } from "../../lib/saas-stripe/purchase-store";

export function SaasCheckoutConsole() {
  const offers = getSelfServeSaasOffers();
  const purchases = listSaasPurchases();
  const events = listSaasWebhookEvents();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Commercial Checkout</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          COM-002 Slice C verification — Stripe SaaS Checkout for Property Manager Professional /
          Business only. No organization or account provisioning on this slice.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: aligned · dedicated webhook /api/commerce/webhooks/stripe
        </p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Flag label="sliceC_stripeCheckout" value={COM_002_FLAGS.sliceC_stripeCheckout} />
        <Flag label="foReady" value={COM_002_FLAGS.foReady} />
        <Flag label="sliceD_provisioning" value={COM_002_FLAGS.sliceD_automaticProvisioning} />
        <Flag label="saasStripeConfigured" value={isSaasStripeConfigured()} />
        <Flag label="saasCheckoutReady" value={isSaasCheckoutReady()} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Offer validation</h2>
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2">Offer</th>
                <th className="px-3 py-2">Env key</th>
                <th className="px-3 py-2">Price configured</th>
                <th className="px-3 py-2">Validation</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const envKey =
                  SAAS_PRICE_ENV_KEYS[offer.id as keyof typeof SAAS_PRICE_ENV_KEYS] ?? "—";
                const price = resolveSaasPriceId(offer.id);
                const validation = validateSaasCheckoutRequest(
                  {
                    productSku: offer.productSku,
                    planTier: offer.planTier,
                    billingCycle: offer.billingCycle ?? "monthly"
                  },
                  resolveSaasPriceId
                );
                return (
                  <tr key={offer.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2 font-mono text-xs">{offer.id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{envKey}</td>
                    <td className="px-3 py-2">{price ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{validation.ok ? "ok" : validation.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Purchase records (this instance)</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Count: {purchases.length}. All rows keep provisioned=false / organizationId=null.
        </p>
        {purchases.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No in-memory purchases yet.</p>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {purchases.slice(0, 20).map((row) => (
              <li
                key={row.stripeCheckoutSessionId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
              >
                {row.stripeCheckoutSessionId} · {row.status} · {row.catalogOfferId} · provisioned=
                {String(row.provisioned)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Webhook delivery (this instance)</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Events: {events.length}</p>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No SaaS webhook events yet.</p>
        ) : (
          <ul className="space-y-2 text-xs font-mono">
            {events.slice(0, 20).map((event) => (
              <li
                key={event.stripeEventId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
              >
                {event.stripeEventId} · {event.eventType} · processed=
                {event.processedAt ? "yes" : "no"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Checklist
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Successful payment → checkout_completed, provisioned false</li>
          <li>Canceled payment → cancel page / no purchase activation</li>
          <li>Webhook delivery on dedicated SaaS endpoint</li>
          <li>Duplicate prevention via event id + Stripe idempotency keys</li>
          <li>Offer / price / plan validation before session create</li>
        </ul>
      </section>
    </main>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm">
      <p className="font-mono text-xs text-[var(--mpa-color-text-muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value ? "true" : "false"}</p>
    </div>
  );
}
