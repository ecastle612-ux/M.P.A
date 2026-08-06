"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type PropertySnapshot = {
  propertyId: string;
  propertyName: string;
  expectedRentThisMonth: number;
  rentCollectedThisMonth: number;
  outstandingBalance: number;
  totalDelinquency: number;
  vendorPaidThisMonth: number;
  vendorPayablesOpen: number;
  delinquencyCount: number;
  occupancyRate: number;
  unitsOccupied: number;
  unitsTotal: number;
  alerts: string[];
};

export function PropertiesMoneyList() {
  const [properties, setProperties] = useState<PropertySnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/finance/reports/properties");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load properties");
        }
        if (!cancelled) {
          setProperties((body.properties as PropertySnapshot[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load properties");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/launcher", label: "Launcher" },
          { href: "/pm/mission-control", label: "Property Manager" },
          { label: "Properties" }
        ]}
      />
      <header className="max-w-3xl">
        <h1 className="font-display text-2xl font-semibold">Properties</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Portfolio properties with operational money health — rent, balances, vendor spend, and delinquency.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? <EmptyState title="Unable to load properties" description={error} /> : null}

      {!loading && !error && properties.length === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Create a property from Financial Operations to start tracking money by property."
        />
      ) : null}

      <ul className="grid gap-3 lg:grid-cols-2">
        {properties.map((property) => (
          <li
            key={property.propertyId}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">
                  <Link
                    href={`/pm/properties/${property.propertyId}`}
                    className="text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {property.propertyName}
                  </Link>
                </h2>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {property.unitsOccupied}/{property.unitsTotal} occupied · {property.occupancyRate}%
                </p>
              </div>
              <Badge variant={property.delinquencyCount > 0 ? "danger" : "success"}>
                {property.delinquencyCount > 0 ? "Past due" : "Healthy"}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Monthly rent</dt>
                <dd>{formatMoney(property.expectedRentThisMonth)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Collected</dt>
                <dd>{formatMoney(property.rentCollectedThisMonth)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Outstanding</dt>
                <dd>{formatMoney(property.outstandingBalance)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Vendor expenses</dt>
                <dd>{formatMoney(property.vendorPaidThisMonth)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--mpa-color-text-secondary)]">
              {property.alerts[0] ?? "No financial alerts"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
