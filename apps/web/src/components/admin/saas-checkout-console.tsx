import {
  COM_002_FLAGS,
  SAAS_DISPLAY_PRICE_ENV_KEYS,
  SAAS_PRICE_ENV_KEYS,
  UNIT_VOLUME_PRICE_ENV_KEYS,
  getSelfServeSaasOffers
} from "@mpa/shared";
import {
  isSaasCheckoutReady,
  isSaasStripeConfigured,
  isUnitVolumeCheckoutReady,
  resolveSaasDisplayPriceId,
  resolveSaasPriceId,
  resolveUnitVolumePriceEnv
} from "../../lib/saas-stripe/client";
import { listSaasPurchases, listSaasWebhookEvents } from "../../lib/saas-stripe/purchase-store";

export function SaasCheckoutConsole() {
  const offers = getSelfServeSaasOffers();
  const purchases = listSaasPurchases();
  const events = listSaasWebhookEvents();
  const unitVolumeKeys = Object.values(UNIT_VOLUME_PRICE_ENV_KEYS);

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Commercial Checkout</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Customer acquisition Checkout is quote-authoritative unit-volume only. Legacy Professional
          / Business offer rows below are historical/admin diagnostics — not customer purchase
          options.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: unit-volume · dedicated webhook /api/commerce/webhooks/stripe
        </p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Flag label="sliceC_stripeCheckout" value={COM_002_FLAGS.sliceC_stripeCheckout} />
        <Flag label="foReady" value={COM_002_FLAGS.foReady} />
        <Flag label="completeReady" value={COM_002_FLAGS.completeReady} />
        <Flag label="unitVolumeCheckoutReady" value={isUnitVolumeCheckoutReady()} />
        <Flag label="saasStripeConfigured" value={isSaasStripeConfigured()} />
        <Flag label="legacySaasCheckoutReady" value={isSaasCheckoutReady()} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Authoritative unit-volume Prices</h2>
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2">Env key</th>
                <th className="px-3 py-2">Configured</th>
              </tr>
            </thead>
            <tbody>
              {unitVolumeKeys.map((envKey) => (
                <tr key={envKey} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <td className="px-3 py-2 font-mono text-xs">{envKey}</td>
                  <td className="px-3 py-2">
                    {resolveUnitVolumePriceEnv(envKey) ? "yes" : "no"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Historical offer diagnostics</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Business rows are historical only — not available for customer purchase. Public catalog
          display uses unit-volume BASE / FO Prices.
        </p>
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2">Offer</th>
                <th className="px-3 py-2">Classification</th>
                <th className="px-3 py-2">Legacy env key</th>
                <th className="px-3 py-2">Display env key</th>
                <th className="px-3 py-2">Legacy price</th>
                <th className="px-3 py-2">Display price</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const legacyEnv =
                  SAAS_PRICE_ENV_KEYS[offer.id as keyof typeof SAAS_PRICE_ENV_KEYS] ?? "—";
                const displayEnv =
                  SAAS_DISPLAY_PRICE_ENV_KEYS[
                    offer.id as keyof typeof SAAS_DISPLAY_PRICE_ENV_KEYS
                  ] ?? "—";
                const classification =
                  offer.planTier === "business"
                    ? "historical — not a customer product"
                    : offer.selfServeEligible
                      ? "historical offer id (customer uses unit-volume quote)"
                      : "not customer-purchasable";
                return (
                  <tr key={offer.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2 font-mono text-xs">{offer.id}</td>
                    <td className="px-3 py-2 text-xs">{classification}</td>
                    <td className="px-3 py-2 font-mono text-xs">{legacyEnv}</td>
                    <td className="px-3 py-2 font-mono text-xs">{displayEnv}</td>
                    <td className="px-3 py-2">
                      {resolveSaasPriceId(offer.id) ? "yes" : "no"}
                    </td>
                    <td className="px-3 py-2">
                      {resolveSaasDisplayPriceId(offer.id) ? "yes" : "no"}
                    </td>
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
          Count: {purchases.length}.
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
