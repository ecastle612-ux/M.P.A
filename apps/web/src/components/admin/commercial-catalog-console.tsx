import {
  COM_002_FLAGS,
  listCatalogOffers,
  toBillingCycleLabel,
  toPlanTierLabel,
  toSkuLabel
} from "@mpa/shared";

/**
 * Master Admin read model for COM-002 Slice A commercial foundation.
 * Read-only — no Stripe Price publishing or offer mutations in this slice.
 */
export function CommercialCatalogConsole() {
  const offers = listCatalogOffers();
  const selfServe = offers.filter((offer) => offer.selfServeEligible);
  const enterprise = offers.filter((offer) => offer.motion === "enterprise_sales");

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Commercial Catalog</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Canonical CatalogOffer read model. Customer acquisition uses unit-volume Checkout for
          Property Manager, Facility Operations, and Complete Platform. Business / Enterprise rows
          are historical or sales-motion diagnostics — not customer purchase options.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: aligned · Slice A foundation
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Commercial flags</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(COM_002_FLAGS).map(([key, value]) => (
            <li
              key={key}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
            >
              <span className="font-mono text-xs text-[var(--mpa-color-text-muted)]">{key}</span>
              <p className="mt-1 font-semibold">{value ? "true" : "false"}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total offers" value={String(offers.length)} />
        <Stat label="Self-serve eligible" value={String(selfServe.length)} />
        <Stat label="Enterprise offers" value={String(enterprise.length)} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Offers</h2>
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Offer id</th>
                <th className="px-3 py-2 font-semibold">Product</th>
                <th className="px-3 py-2 font-semibold">Plan</th>
                <th className="px-3 py-2 font-semibold">Cycle</th>
                <th className="px-3 py-2 font-semibold">Motion</th>
                <th className="px-3 py-2 font-semibold">Self-serve</th>
                <th className="px-3 py-2 font-semibold">Classification</th>
                <th className="px-3 py-2 font-semibold">Unit capacity</th>
                <th className="px-3 py-2 font-semibold">Stripe Price</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <td className="px-3 py-2 font-mono text-xs">{offer.id}</td>
                  <td className="px-3 py-2">{toSkuLabel(offer.productSku)}</td>
                  <td className="px-3 py-2">{toPlanTierLabel(offer.planTier)}</td>
                  <td className="px-3 py-2">
                    {offer.billingCycle ? toBillingCycleLabel(offer.billingCycle) : "—"}
                  </td>
                  <td className="px-3 py-2">{offer.motion}</td>
                  <td className="px-3 py-2">{offer.selfServeEligible ? "yes" : "no"}</td>
                  <td className="px-3 py-2 text-xs">
                    {offer.planTier === "business"
                      ? "historical — not a customer product"
                      : offer.planTier === "enterprise"
                        ? "sales motion only"
                        : "unit-volume customer product"}
                  </td>
                  <td className="px-3 py-2">
                    {offer.planTier === "professional"
                      ? "Base 500 units + $39 / block"
                      : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{offer.stripePriceId ?? "null"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
