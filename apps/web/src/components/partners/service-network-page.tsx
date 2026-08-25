"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PARTNER_OPPORTUNITY_NO_GUARANTEE_COPY,
  PARTNER_OPPORTUNITY_NO_MATCH_COPY,
  PARTNER_OPPORTUNITY_SELECT_COPY,
  PARTNER_SERVICE_CATEGORIES,
  PARTNER_SERVICE_CATEGORY_LABELS
} from "@mpa/shared";
import { Button, FormField, Input, Select, Textarea } from "@mpa/ui";

type Surface = "residential" | "facility";

type PropertyRow = { id: string; name: string; city: string | null; region: string | null };
type PartnerCard = {
  id: string;
  companyName: string;
  servicesOffered: string;
  serviceArea: string;
  website: string | null;
  phone: string;
  email: string;
  partnerTypeLabel: string;
  status: string;
};
type OpportunityRow = {
  id: string;
  status: string;
  category: string;
  categoryLabel: string;
  description: string;
  urgency: string;
  city: string | null;
  region: string | null;
  workOrderId: string | null;
  selectedPartnerId: string | null;
  expiresAt: string;
  routes: Array<{
    id: string;
    partnerId: string;
    response: string | null;
    selected: boolean;
    partner: PartnerCard | null;
  }>;
};

export function ServiceNetworkPage({ surface }: { surface: Surface }) {
  const api = surface === "facility" ? "/api/facility/service-network/opportunities" : "/api/pm/service-network/opportunities";
  const home = surface === "facility" ? "/facility/operations" : "/pm/maintenance";
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [category, setCategory] = useState("plumbing");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [preferredTiming, setPreferredTiming] = useState("");
  const [workOrderId, setWorkOrderId] = useState(searchParams.get("workOrderId") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(api);
    const payload = (await response.json()) as {
      properties?: PropertyRow[];
      opportunities?: OpportunityRow[];
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error ?? "Could not load service opportunities.");
      return;
    }
    setProperties(payload.properties ?? []);
    setRows(payload.opportunities ?? []);
  }

  useEffect(() => {
    void load();
  }, [api]);

  async function createOpportunity() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const response = await fetch(api, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId,
        category,
        description,
        urgency,
        preferredTiming: preferredTiming || null,
        ...(workOrderId.trim() ? { workOrderId: workOrderId.trim() } : {})
      })
    });
    const payload = (await response.json()) as { noMatch?: boolean; noMatchCopy?: string; error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not create opportunity.");
      return;
    }
    setNotice(payload.noMatch ? payload.noMatchCopy ?? PARTNER_OPPORTUNITY_NO_MATCH_COPY : "Opportunity routed.");
    setDescription("");
    await load();
  }

  async function act(id: string, path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const response = await fetch(`${api}/${id}${path}`, {
      method: path ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not update opportunity.");
      return;
    }
    await load();
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {surface === "facility" ? "Facility Operations" : "Property Manager"}
        </p>
        <h1 className="font-display text-2xl font-semibold">Find a Service Partner</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Request physical service from Ready Certified Service or Strategic Partners. This is not a bid
          marketplace and does not create a contract or payment.
        </p>
        <p className="mt-2 text-sm">
          <Link href={home} className="underline">
            Back to {surface === "facility" ? "Operations" : "Maintenance"}
          </Link>
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}

      <form
        className="grid max-w-3xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void createOpportunity();
        }}
      >
        <FormField id="sn-property" label="Property / facility">
          <Select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} required>
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="sn-category" label="Service category">
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            {PARTNER_SERVICE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {PARTNER_SERVICE_CATEGORY_LABELS[item]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="sn-urgency" label="Urgency">
          <Select value={urgency} onChange={(event) => setUrgency(event.target.value)}>
            <option value="normal">Normal</option>
            <option value="soon">Soon</option>
            <option value="urgent">Urgent</option>
          </Select>
        </FormField>
        <FormField id="sn-timing" label="Preferred timing">
          <Input value={preferredTiming} onChange={(event) => setPreferredTiming(event.target.value)} />
        </FormField>
        <label className="space-y-1 text-xs md:col-span-2">
          <span className="font-medium">Description</span>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={3} />
        </label>
        <FormField id="sn-wo" label="Existing work order (optional)">
          <Input
            value={workOrderId}
            onChange={(event) => setWorkOrderId(event.target.value)}
            placeholder="Link an existing work order UUID"
          />
        </FormField>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>
            Find a Service Partner
          </Button>
        </div>
      </form>

      <section className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No service opportunities yet.</p>
        ) : null}
        {rows.map((row) => (
          <article key={row.id} className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">{row.categoryLabel}</h2>
              <span className="text-sm">{row.status}</span>
            </div>
            <p className="text-sm">{row.description}</p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {[row.city, row.region].filter(Boolean).join(", ") || "Location on file"} · {row.urgency}
              {row.workOrderId ? ` · Work order linked` : ""}
            </p>
            {row.routes.length === 0 ? (
              <p className="text-sm">{PARTNER_OPPORTUNITY_NO_MATCH_COPY}</p>
            ) : null}
            <ul className="space-y-2">
              {row.routes.map((entry) => (
                <li key={entry.id} className="rounded border border-[var(--mpa-color-border-default)] p-3 text-sm">
                  <strong>{entry.partner?.companyName ?? "Partner"}</strong>
                  <span className="block text-[var(--mpa-color-text-secondary)]">
                    {entry.partner?.partnerTypeLabel} · {entry.partner?.status} · {entry.response ?? "awaiting response"}
                  </span>
                  <span className="block">{entry.partner?.servicesOffered}</span>
                  <span className="block">{entry.partner?.serviceArea}</span>
                  <span className="block">
                    {entry.partner?.phone} · {entry.partner?.email}
                    {entry.partner?.website ? ` · ${entry.partner.website}` : ""}
                  </span>
                  {entry.response === "interested" && !entry.selected && row.status !== "partner_selected" ? (
                    <Button
                      className="mt-2"
                      disabled={busy}
                      onClick={() => void act(row.id, "/select", { partnerId: entry.partnerId })}
                    >
                      Select Partner
                    </Button>
                  ) : null}
                  {entry.selected ? <p className="mt-2">{PARTNER_OPPORTUNITY_SELECT_COPY}</p> : null}
                </li>
              ))}
            </ul>
            {row.status === "partner_selected" ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_OPPORTUNITY_NO_GUARANTEE_COPY}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {row.status === "open" || row.status === "routed" || row.status === "partner_interested" ? (
                <>
                  <Button disabled={busy} onClick={() => void act(row.id, "", { action: "reroute" })}>
                    Route Again
                  </Button>
                  <Button disabled={busy} onClick={() => void act(row.id, "", { action: "close" })}>
                    Close
                  </Button>
                  <Button disabled={busy} onClick={() => void act(row.id, "", { action: "cancel" })}>
                    Cancel
                  </Button>
                </>
              ) : null}
              {row.status === "partner_selected" && !row.workOrderId ? (
                <Button disabled={busy} onClick={() => void act(row.id, "/create-work-order", {})}>
                  Create Work Order
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
