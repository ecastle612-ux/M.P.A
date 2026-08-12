import { buildPmDemoShowcase, PM_DEMO_SNAPSHOT } from "@mpa/shared";

/**
 * Premium hero product representation built from the existing Live Demo
 * Mission Control snapshot — real labels and operational structure, not invented UI.
 */
export function LandingHeroProductVisual() {
  const showcase = buildPmDemoShowcase(PM_DEMO_SNAPSHOT);
  const queue = showcase.queue.slice(0, 3);
  const properties = showcase.occupancyBars.slice(0, 3);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-[12%] right-0 hidden w-[min(560px,48%)] xl:block"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 top-8 origin-bottom-right scale-[0.98] overflow-hidden rounded-tl-xl border border-white/25 bg-[#F4F7F6] shadow-[0_28px_70px_rgba(0,0,0,0.38)] motion-safe:animate-[mpa-rise_900ms_ease-out]">
        <div className="flex items-center justify-between border-b border-[#D7E0DC] bg-[#0B1F1A] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
              Mission Control
            </p>
            <p className="font-display text-sm font-semibold text-white">
              {showcase.organizationName}
            </p>
          </div>
          <div className="flex gap-3 text-right">
            {showcase.kpis.slice(0, 2).map((kpi) => (
              <div key={kpi.id}>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
                  {kpi.label}
                </p>
                <p className="font-display text-sm font-semibold text-white">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-3 p-3">
          <div className="space-y-3">
            <div className="rounded-md border border-[#D7E0DC] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0F6B56]">
                Work that needs you
              </p>
              <ul className="mt-2 space-y-2">
                {queue.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded border border-[#E5EBE8] px-2.5 py-2 ${
                      item.badge === "immediate"
                        ? "border-l-[3px] border-l-[#C0392B]"
                        : "border-l-[3px] border-l-[#B45309]"
                    }`}
                  >
                    <p className="truncate text-xs font-semibold text-[#1A2330]">{item.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-[#5B6B66]">
                      {item.module} · {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-[#D7E0DC] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B6B66]">
                Properties &amp; units
              </p>
              <ul className="mt-2 space-y-2">
                {properties.map((bar) => (
                  <li key={bar.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="truncate font-medium text-[#1A2330]">{bar.label}</span>
                      <span className="shrink-0 text-[#5B6B66]">
                        {bar.units} units · {bar.openWorkOrders} WO
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#E6F0EC]">
                      <div
                        className="h-full rounded-full bg-[#0F6B56]"
                        style={{ width: `${Math.min(100, Math.max(8, bar.pct))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-[#D7E0DC] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B6B66]">
                Maintenance
              </p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-[#F7FAF9] px-1 py-2">
                  <dt className="text-[9px] uppercase tracking-wide text-[#5B6B66]">Open</dt>
                  <dd className="font-display text-sm font-semibold text-[#1A2330]">
                    {showcase.maintenance.open}
                  </dd>
                </div>
                <div className="rounded bg-[#F7FAF9] px-1 py-2">
                  <dt className="text-[9px] uppercase tracking-wide text-[#5B6B66]">Urgent</dt>
                  <dd className="font-display text-sm font-semibold text-[#C0392B]">
                    {showcase.maintenance.urgent}
                  </dd>
                </div>
                <div className="rounded bg-[#F7FAF9] px-1 py-2">
                  <dt className="text-[9px] uppercase tracking-wide text-[#5B6B66]">Active</dt>
                  <dd className="font-display text-sm font-semibold text-[#1A2330]">
                    {showcase.maintenance.inProgress}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border border-[#D7E0DC] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B6B66]">
                Vendors &amp; billing
              </p>
              <ul className="mt-2 space-y-2 text-[11px] text-[#1A2330]">
                <li className="flex justify-between gap-2 border-b border-[#EEF2F0] pb-1.5">
                  <span>Pending vendor approvals</span>
                  <span className="font-semibold">{showcase.financial.pendingApprovals}</span>
                </li>
                <li className="flex justify-between gap-2 border-b border-[#EEF2F0] pb-1.5">
                  <span>Outstanding balances</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0
                    }).format(showcase.financial.outstandingBalance)}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>Rent roll (demo)</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0
                    }).format(showcase.financial.monthlyRentRoll)}
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-md border border-[#0F6B56]/25 bg-[#E6F4EF] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0F6B56]">
                Operational visibility
              </p>
              <p className="mt-1 text-[11px] leading-4 text-[#0B1F1A]/85">
                Work orders, vendors, units, and billing in one Mission Control view.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
