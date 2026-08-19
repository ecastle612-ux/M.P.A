import { ONLINE_RENT_COLLECTION_METHOD_LABELS } from "@mpa/shared";

/** Compact ACH / Cards / Pay Once / AutoPay labels. Canopy tokens only. */
export function OnlineRentCollectionVisual({
  className = ""
}: {
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap gap-2 ${className}`}
      aria-label="Accepted tenant payment options"
    >
      {ONLINE_RENT_COLLECTION_METHOD_LABELS.map((label) => (
        <li
          key={label}
          className="rounded-full border border-[var(--mpa-color-brand-primary)]/35 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
