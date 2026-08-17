"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ownerDay1ChecklistForSku,
  skuIncludesFacilityOperations,
  skuIncludesPropertyManager,
  workspaceLauncherItemsForSku,
  type ProductSku
} from "@mpa/shared";
import { Badge, Button, Skeleton } from "@mpa/ui";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";
import {
  buildCompleteLauncherViewModel,
  type FoMissionControlApiBody,
  type PmMissionControlApiBody,
  priorityBadgeVariant,
  workspaceSectionLabel
} from "../../lib/commercial/complete-launcher-presentation";
import { OwnerDay1ChecklistCard } from "./owner-day1-checklist";
import { OnlinePaymentsDiscoveryLink } from "./online-payments-discovery";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

function CompleteUnifiedLauncher({ productSku }: { productSku: ProductSku }) {
  const [pmBody, setPmBody] = useState<PmMissionControlApiBody | null>(null);
  const [foBody, setFoBody] = useState<FoMissionControlApiBody | null>(null);
  const [pmError, setPmError] = useState<string | null>(null);
  const [foError, setFoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      const [pmResult, foResult] = await Promise.allSettled([
        fetch("/api/pm/mission-control", { signal: controller.signal }).then(async (response) => {
          const body = (await response.json()) as PmMissionControlApiBody;
          if (!response.ok) {
            throw new Error(body.error ?? "Failed to load Property Operations");
          }
          return body;
        }),
        fetch("/api/facility/mission-control", { signal: controller.signal }).then(
          async (response) => {
            const body = (await response.json()) as FoMissionControlApiBody;
            if (!response.ok || !body.snapshot) {
              throw new Error(body.error ?? "Failed to load Facility Operations");
            }
            return body;
          }
        )
      ]);

      if (controller.signal.aborted) {
        return;
      }

      if (pmResult.status === "fulfilled") {
        setPmBody(pmResult.value);
        setPmError(null);
      } else {
        setPmBody(null);
        setPmError(
          pmResult.reason instanceof Error
            ? pmResult.reason.message
            : "Failed to load Property Operations"
        );
      }

      if (foResult.status === "fulfilled") {
        setFoBody(foResult.value);
        setFoError(null);
      } else {
        setFoBody(null);
        setFoError(
          foResult.reason instanceof Error
            ? foResult.reason.message
            : "Failed to load Facility Operations"
        );
      }

      setLoading(false);
    })();

    return () => controller.abort();
  }, [reloadToken]);

  function retry() {
    setLoading(true);
    setPmError(null);
    setFoError(null);
    setReloadToken((value) => value + 1);
  }

  const view = buildCompleteLauncherViewModel({
    sku: productSku,
    pmBody,
    foBody,
    pmError,
    foError
  });

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Start here" }]} />

      <section className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {view.labels.productEyebrow}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Start here
        </h1>
        <p className="text-base leading-7 text-[var(--mpa-color-text-secondary)]">
          {view.labels.productTagline} Review today&apos;s priorities, then open the operational
          capability that owns the work.
        </p>
      </section>

      <OwnerDay1ChecklistCard
        checklist={ownerDay1ChecklistForSku("mpa_complete_platform")}
        showOwnerClarity
      />
      <OnlinePaymentsDiscoveryLink productSku={productSku} className="max-w-3xl" />

      {view.loadErrors.length > 0 ? (
        <section
          aria-label="Attention load issues"
          className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Some attention data could not load. You can still open either workspace.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            {view.loadErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={retry}>
              Retry
            </Button>
          </div>
        </section>
      ) : null}

      <section aria-label="Operational capabilities" className="max-w-4xl space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Operational capabilities
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Same Complete Platform organization — switch capability, not product.
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {view.handoffs.map((handoff) => (
            <li key={handoff.id}>
              <Link
                href={handoff.href}
                className={`mpa-lift block min-h-[7.5rem] rounded-lg border border-[var(--mpa-color-brand-primary)]/35 border-l-[3px] bg-white p-5 shadow-[0_1px_0_rgba(18,21,26,0.04)] ${
                  handoff.id === "property_operations"
                    ? "border-l-[var(--mpa-color-brand-primary)]"
                    : "border-l-[var(--mpa-color-text-primary)]"
                } ${linkFocus}`}
              >
                <p className="font-semibold text-[var(--mpa-color-text-primary)]">{handoff.title}</p>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {handoff.summary}
                </p>
                <p className="mt-3 text-sm font-medium text-[var(--mpa-color-brand-primary)]">
                  {handoff.cta}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Today" className="max-w-4xl space-y-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Today
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            The most important current work across your organization&apos;s property and facility
            capabilities.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}

        {!loading && view.emptyGuidance ? (
          <div className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4">
            <p className="font-semibold text-[var(--mpa-color-text-primary)]">
              {view.emptyGuidance.title}
            </p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {view.emptyGuidance.detail}
            </p>
            <p className="mt-3">
              <Link
                href={view.emptyGuidance.href}
                className={`inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] underline ${linkFocus}`}
              >
                {view.emptyGuidance.cta}
              </Link>
            </p>
          </div>
        ) : null}

        {!loading && view.priorities.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                ["property_operations", view.propertyPriorities],
                ["facility_operations", view.facilityPriorities]
              ] as const
            ).map(([workspace, items]) => (
              <div
                key={workspace}
                className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              >
                <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  {workspaceSectionLabel(workspace)}
                </h3>
                {items.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    No urgent items from this workspace right now.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`mpa-lift block rounded-md border border-[var(--mpa-color-border-default)] p-3 ${linkFocus}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium text-[var(--mpa-color-text-primary)]">
                              {item.label}
                            </p>
                            <Badge variant={priorityBadgeVariant(item.tone)}>
                              {item.tone === "critical"
                                ? "Critical"
                                : item.tone === "watch"
                                  ? "Watch"
                                  : "Today"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                            {item.detail}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function CatalogLauncher({
  productSku,
  productLabel
}: {
  productSku: ProductSku | null;
  productLabel: string | null;
}) {
  const items = workspaceLauncherItemsForSku(productSku);
  const hasPm = productSku ? skuIncludesPropertyManager(productSku) : false;
  const hasFo = productSku ? skuIncludesFacilityOperations(productSku) : false;

  const grouped = {
    property_manager: items.filter((item) => item.product === "property_manager"),
    facility_operations: items.filter((item) => item.product === "facility_operations"),
    shared: items.filter((item) => item.product === "shared" || item.product === "setup")
  };

  const missionControlItems = items.filter(
    (item) => item.id === "pm_mc" || item.id === "fac_mc"
  );

  const eyebrow = hasPm && !hasFo
    ? "Property Manager"
    : hasFo && !hasPm
      ? "Facility Operations"
      : "Workspace";

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Workspace Launcher" }]} />
      <section className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Workspace Launcher
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          {productLabel
            ? `Active plan: ${productLabel}. Open your attention home to start the day.`
            : "Select a product in Guided Setup, then return here to open your workspace."}
        </p>
      </section>

      {missionControlItems.length > 0 ? (
        <section
          aria-label="Begin your day"
          className="max-w-4xl space-y-3 rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            Begin your day
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {missionControlItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`block rounded-md border border-[var(--mpa-color-brand-primary)]/40 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-4 hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
                >
                  <p className="font-semibold text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                    {item.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(
        [
          ["property_manager", grouped.property_manager, "Property Manager"],
          ["facility_operations", grouped.facility_operations, "Facility Operations"],
          ["shared", grouped.shared, "Shared"]
        ] as const
      ).map(([key, groupItems, title]) =>
        groupItems.length ? (
          <section key={key}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {title}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groupItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`block rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
                  >
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                    <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}
    </main>
  );
}

export function WorkspaceLauncherPage() {
  const { productSku, productLabel } = useCommercialContext();

  if (productSku === "mpa_complete_platform") {
    return <CompleteUnifiedLauncher productSku={productSku} />;
  }

  return <CatalogLauncher productSku={productSku} productLabel={productLabel} />;
}
