"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, FormField, Input, Select } from "@mpa/ui";
import {
  PARTNER_DIRECTORY_FILTERS,
  PARTNER_TYPE_LABELS,
  bpsToPercent,
  isPartnerDirectoryFilter,
  partnerMatchesDirectoryFilter,
  partnerReferralPath,
  type PartnerDirectoryFilter,
  type PartnerType
} from "@mpa/shared";

type PartnerRow = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  serviceArea: string;
  companyServiceType: string;
  servicesOffered: string;
  partnerType: PartnerType;
  partnerTypeLabel: string;
  status: string;
  publicSlug: string | null;
  organizationId: string | null;
  publicPortalEnabled: boolean;
  portalDescription: string | null;
  portalLive: boolean;
  portalPath: string | null;
  requestCount: number;
  commissionBps: number;
  commissionPercent: number;
  createdAt: string;
  invitationStatus: string | null;
  invitationSentAt: string | null;
  invitationAcceptedAt: string | null;
  accountConnected: boolean;
  propertyCount: number;
  onboarding: {
    onboardingStatus: "not_started" | "in_progress" | "complete";
    readiness: "ready" | "not_ready";
    percent: number;
    nextLabel: string | null;
    profileComplete: boolean;
    portalConfigured: boolean;
    qrComplete: boolean;
  } | null;
};

type ReferralRow = {
  id: string;
  partnerId: string;
  organizationId: string;
  slugSnapshot: string;
  flaggedReason: string | null;
  createdAt: string;
};

type CommissionRow = {
  id: string;
  partnerId: string;
  organizationId: string;
  eligibleRevenueCents: number;
  commissionBps: number;
  commissionCents: number;
  qualifyingMonthIndex: number;
  status: string;
  offsetRequired: boolean;
  createdAt: string;
};

type EventRow = {
  id: string;
  partnerId: string | null;
  action: string;
  createdAt: string;
};

type PropertyPortalRow = {
  id: string;
  publicName: string;
  publicSlug: string;
  enabled: boolean;
  displayUrl: string;
  portalUrl: string;
  qrSvg: string | null;
  requestCount: number;
  propertyId: string;
  canonicalPropertyId?: string;
  address: string;
};

export function PartnersConsole() {
  const [partners, setPartners] = useState<PartnerRow[] | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType>("referral");
  const [commissionPercent, setCommissionPercent] = useState("20");
  const [organizationId, setOrganizationId] = useState("");
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [portalDescription, setPortalDescription] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [propertyPortals, setPropertyPortals] = useState<PropertyPortalRow[]>([]);
  const [propertySlugEdit, setPropertySlugEdit] = useState("");
  const [propertyNameEdit, setPropertyNameEdit] = useState("");
  const [selectedPropertyPortalId, setSelectedPropertyPortalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<PartnerDirectoryFilter | "all">("all");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteType, setInviteType] = useState<PartnerType>("certified_service");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteWebsite, setInviteWebsite] = useState("");
  const [inviteArea, setInviteArea] = useState("");
  const [inviteServices, setInviteServices] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [opportunityOversight, setOpportunityOversight] = useState<{
    opportunities: Array<{
      id: string;
      status: string;
      category: string;
      city: string | null;
      region: string | null;
      routedCount: number;
      interestedCount: number;
    }>;
    unmetDemand: Array<{ serviceCategory: string; city: string | null; region: string | null; createdAt: string }>;
    analytics: { created: number; matchRate: number | null; noMatchRate: number | null; partnerResponseRate: number | null; partnerSelectionRate: number | null };
  } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/partners");
    const payload = (await response.json()) as {
      partners?: PartnerRow[];
      referrals?: ReferralRow[];
      commissions?: CommissionRow[];
      events?: EventRow[];
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to load partners");
      return;
    }
    const nextPartners = payload.partners ?? [];
    setPartners(nextPartners);
    setReferrals(payload.referrals ?? []);
    setCommissions(payload.commissions ?? []);
    setEvents(payload.events ?? []);
    const current = nextPartners.find((row) => row.id === selectedId);
    if (current) {
      setSlug(current.publicSlug ?? "");
      setPartnerType(current.partnerType);
      setCommissionPercent(String(current.commissionPercent));
      setOrganizationId(current.organizationId ?? "");
      setPortalEnabled(current.publicPortalEnabled);
      setPortalDescription(current.portalDescription ?? "");
      setQrSvg(null);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch("/api/admin/partners", { signal: controller.signal });
      const payload = (await response.json()) as {
        partners?: PartnerRow[];
        referrals?: ReferralRow[];
        commissions?: CommissionRow[];
        events?: EventRow[];
        error?: string;
      };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(payload.error ?? "Failed to load partners");
        return;
      }
      setPartners(payload.partners ?? []);
      setReferrals(payload.referrals ?? []);
      setCommissions(payload.commissions ?? []);
      setEvents(payload.events ?? []);
      const oversight = await fetch("/api/admin/partner-opportunities", { signal: controller.signal });
      if (oversight.ok) {
        setOpportunityOversight((await oversight.json()) as NonNullable<typeof opportunityOversight>);
      }
    })().catch(() => {
      if (!controller.signal.aborted) {
        setError("Failed to load partners");
      }
    });
    return () => controller.abort();
  }, []);

  const selected = useMemo(
    () => partners?.find((row) => row.id === selectedId) ?? null,
    [partners, selectedId]
  );

  const visiblePartners = useMemo(() => {
    const rows = partners ?? [];
    if (directoryFilter === "all" || !isPartnerDirectoryFilter(directoryFilter)) return rows;
    return rows.filter((row) =>
      partnerMatchesDirectoryFilter(directoryFilter, {
        status: row.status as "applied" | "approved" | "active" | "suspended" | "rejected",
        invitationStatus: (row.invitationStatus as "pending" | "accepted" | "expired" | "revoked") ?? null,
        onboardingStatus: row.onboarding?.onboardingStatus ?? "not_started",
        readiness: row.onboarding?.readiness ?? "not_ready"
      })
    );
  }, [partners, directoryFilter]);

  async function loadPropertyPortals(partnerId: string) {
    const response = await fetch(`/api/admin/partners/property-portals?partnerId=${partnerId}`);
    const payload = (await response.json()) as { items?: PropertyPortalRow[]; error?: string };
    if (!response.ok) {
      setPropertyPortals([]);
      return;
    }
    setPropertyPortals(payload.items ?? []);
  }

  function selectPartner(row: PartnerRow) {
    setSelectedId(row.id);
    setSlug(row.publicSlug ?? "");
    setPartnerType(row.partnerType);
    setCommissionPercent(String(row.commissionPercent));
    setOrganizationId(row.organizationId ?? "");
    setPortalEnabled(row.publicPortalEnabled);
    setPortalDescription(row.portalDescription ?? "");
    setQrSvg(null);
    setSelectedPropertyPortalId(null);
    void loadPropertyPortals(row.id);
  }

  async function act(
    action: string,
    extra: Record<string, unknown> = {},
    partnerId = selected?.id
  ) {
    if (!partnerId) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, action, ...extra })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Action failed");
      return;
    }
    setNotice("Updated.");
    await load();
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Partners</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Review applications, invite recruited companies, assign partner type, and track onboarding.
          Payouts stay manual. This is platform administration only.
        </p>
      </div>

      {opportunityOversight ? (
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">Service opportunities</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Inspect routing, interest, selection, and unmet demand. Master Admin does not select a Partner for
            the customer.
          </p>
          <p className="text-sm">
            Created {opportunityOversight.analytics.created} · match {opportunityOversight.analytics.matchRate ?? "—"}%
            · no-match {opportunityOversight.analytics.noMatchRate ?? "—"}% · response{" "}
            {opportunityOversight.analytics.partnerResponseRate ?? "—"}% · selection{" "}
            {opportunityOversight.analytics.partnerSelectionRate ?? "—"}%
          </p>
          <ul className="space-y-1 text-sm">
            {opportunityOversight.opportunities.slice(0, 12).map((row) => (
              <li key={row.id}>
                {row.category} · {row.status} · {[row.city, row.region].filter(Boolean).join(", ") || "unspecified"} ·
                routed {row.routedCount} · interested {row.interestedCount}
              </li>
            ))}
          </ul>
          {opportunityOversight.unmetDemand.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold">No-match areas</h3>
              <ul className="text-sm">
                {opportunityOversight.unmetDemand.slice(0, 8).map((row, index) => (
                  <li key={`${row.serviceCategory}-${row.createdAt}-${index}`}>
                    {row.serviceCategory} · {[row.city, row.region].filter(Boolean).join(", ") || "unspecified"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-xl font-semibold">Invite Partner</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <FormField id="invite-company" label="Company name">
            <Input id="invite-company" value={inviteCompany} onChange={(event) => setInviteCompany(event.target.value)} />
          </FormField>
          <FormField id="invite-contact" label="Primary contact">
            <Input id="invite-contact" value={inviteContact} onChange={(event) => setInviteContact(event.target.value)} />
          </FormField>
          <FormField id="invite-email" label="Email">
            <Input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
          </FormField>
          <FormField id="invite-type" label="Partner type">
            <Select id="invite-type" value={inviteType} onChange={(event) => setInviteType(event.target.value as PartnerType)}>
              {(Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((type) => (
                <option key={type} value={type}>
                  {PARTNER_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="invite-phone" label="Phone (optional)">
            <Input id="invite-phone" value={invitePhone} onChange={(event) => setInvitePhone(event.target.value)} />
          </FormField>
          <FormField id="invite-website" label="Website (optional)">
            <Input id="invite-website" value={inviteWebsite} onChange={(event) => setInviteWebsite(event.target.value)} />
          </FormField>
          <FormField id="invite-area" label="Service area (optional)">
            <Input id="invite-area" value={inviteArea} onChange={(event) => setInviteArea(event.target.value)} />
          </FormField>
          <FormField id="invite-services" label="Services (optional)">
            <Input id="invite-services" value={inviteServices} onChange={(event) => setInviteServices(event.target.value)} />
          </FormField>
          <FormField id="invite-note" label="Internal note (optional)">
            <Input id="invite-note" value={inviteNote} onChange={(event) => setInviteNote(event.target.value)} />
          </FormField>
        </div>
        <Button
          type="button"
          disabled={loading}
          onClick={() => {
            void (async () => {
              setLoading(true);
              setError(null);
              setNotice(null);
              const response = await fetch("/api/admin/partners", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  companyName: inviteCompany,
                  contactName: inviteContact,
                  email: inviteEmail,
                  partnerType: inviteType,
                  phone: invitePhone || undefined,
                  website: inviteWebsite || undefined,
                  serviceArea: inviteArea || undefined,
                  servicesOffered: inviteServices || undefined,
                  notes: inviteNote || undefined
                })
              });
              const payload = (await response.json()) as { error?: string };
              setLoading(false);
              if (!response.ok) {
                setError(payload.error ?? "Invite failed");
                return;
              }
              setNotice("Invitation sent.");
              setInviteCompany("");
              setInviteContact("");
              setInviteEmail("");
              await load();
            })();
          }}
        >
          Invite Partner
        </Button>
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Partner directory filters">
        <Button
          type="button"
          size="sm"
          variant={directoryFilter === "all" ? "primary" : "secondary"}
          onClick={() => setDirectoryFilter("all")}
        >
          All
        </Button>
        {PARTNER_DIRECTORY_FILTERS.map((filter) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={directoryFilter === filter ? "primary" : "secondary"}
            onClick={() => setDirectoryFilter(filter)}
          >
            {filter === "applications"
              ? "Applications"
              : filter === "invited"
                ? "Invited"
                : filter === "onboarding"
                  ? "Onboarding"
                  : filter === "ready"
                    ? "Ready"
                    : filter === "active"
                      ? "Active"
                      : "Suspended"}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]" role="status">
          {notice}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
            <tr>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Portal</th>
              <th className="px-3 py-2 font-medium">Requests</th>
              <th className="px-3 py-2 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {visiblePartners.map((row) => (
              <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left font-medium underline"
                    onClick={() => selectPartner(row)}
                  >
                    {row.companyName}
                  </button>
                  <div className="text-xs text-[var(--mpa-color-text-muted)]">{row.email}</div>
                </td>
                <td className="px-3 py-2 capitalize">{row.status}</td>
                <td className="px-3 py-2">{row.partnerTypeLabel}</td>
                <td className="px-3 py-2">{row.publicSlug ?? "—"}</td>
                <td className="px-3 py-2">{row.portalLive ? "Live" : row.publicPortalEnabled ? "Off" : "Disabled"}</td>
                <td className="px-3 py-2">{row.requestCount}</td>
                <td className="px-3 py-2">{row.commissionPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">{selected.companyName}</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {selected.contactName} · {selected.phone} · {selected.city}, {selected.state}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {selected.companyServiceType}. {selected.servicesOffered}. Service area:{" "}
            {selected.serviceArea}.
          </p>
          {selected.publicSlug ? (
            <p className="text-sm">
              Referral path: <code>{partnerReferralPath(selected.publicSlug)}</code>
            </p>
          ) : null}
          {selected.portalPath ? (
            <p className="text-sm">
              Portal URL: <code>{selected.portalPath}</code>
              {selected.portalLive ? " · live" : " · not live"}
            </p>
          ) : null}
          <p className="text-sm">Request count: {selected.requestCount}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Invitation</dt>
              <dd>{selected.invitationStatus ?? "not sent"}</dd>
            </div>
            <div>
              <dt className="font-medium">Invitation sent</dt>
              <dd>{selected.invitationSentAt ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Invitation accepted</dt>
              <dd>{selected.invitationAcceptedAt ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Account connected</dt>
              <dd>{selected.accountConnected ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-medium">Onboarding</dt>
              <dd>
                {selected.onboarding
                  ? `${selected.onboarding.percent}% · ${selected.onboarding.onboardingStatus}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Readiness</dt>
              <dd>{selected.onboarding?.readiness ?? "not_ready"}</dd>
            </div>
            <div>
              <dt className="font-medium">Profile</dt>
              <dd>{selected.onboarding?.profileComplete ? "Complete" : "Incomplete"}</dd>
            </div>
            <div>
              <dt className="font-medium">Portal</dt>
              <dd>{selected.onboarding?.portalConfigured ? "Configured" : "Not configured"}</dd>
            </div>
            <div>
              <dt className="font-medium">Property portals</dt>
              <dd>{selected.propertyCount}</dd>
            </div>
            <div>
              <dt className="font-medium">QR</dt>
              <dd>{selected.onboarding?.qrComplete ? "Completed" : "Not completed"}</dd>
            </div>
          </dl>

          <div className="grid gap-3 md:grid-cols-3">
            <FormField id="partner-slug" label="Public slug">
              <Input id="partner-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
            </FormField>
            <FormField id="partner-type" label="Partner type">
              <Select
                id="partner-type"
                value={partnerType}
                onChange={(event) => setPartnerType(event.target.value as PartnerType)}
              >
                {(Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((type) => (
                  <option key={type} value={type}>
                    {PARTNER_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="partner-rate" label="Commission %">
              <Input
                id="partner-rate"
                value={commissionPercent}
                onChange={(event) => setCommissionPercent(event.target.value)}
              />
            </FormField>
            <FormField id="partner-org" label="Receiving organization ID">
              <Input
                id="partner-org"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </FormField>
            <FormField id="partner-portal-description" label="Public portal description">
              <Input
                id="partner-portal-description"
                value={portalDescription}
                onChange={(event) => setPortalDescription(event.target.value)}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={portalEnabled}
                onChange={(event) => setPortalEnabled(event.target.checked)}
              />
              Public Service Portal Enabled
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading}
              onClick={() =>
                void act("update", {
                  publicSlug: slug,
                  partnerType,
                  commissionPercent: Number(commissionPercent),
                  organizationId: organizationId || null,
                  publicPortalEnabled: portalEnabled,
                  portalDescription: portalDescription || null
                })
              }
            >
              Save slug / type / rate
            </Button>
            <Button type="button" disabled={loading} onClick={() => void act("approve", { publicSlug: slug, partnerType })}>
              Approve
            </Button>
            <Button type="button" disabled={loading} onClick={() => void act("activate")}>
              Activate
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("suspend")}>
              Suspend
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("reject")}>
              Reject
            </Button>
            <Button type="button" disabled={loading} onClick={() => void act("invite")}>
              Send Invitation
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("resend_invitation")}>
              Resend Invitation
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("send_setup_reminder")}>
              Send Setup Reminder
            </Button>
            <Button
              type="button"
              disabled={loading || !selected.id}
              variant="secondary"
              onClick={() => {
                void (async () => {
                  const response = await fetch(`/api/admin/partners/qr?partnerId=${selected.id}`);
                  const payload = (await response.json()) as { qrSvg?: string; error?: string };
                  if (!response.ok || !payload.qrSvg) {
                    setError(payload.error ?? "QR is unavailable.");
                    return;
                  }
                  setQrSvg(payload.qrSvg);
                })();
              }}
            >
              Show portal QR
            </Button>
          </div>
          {qrSvg ? (
            <div
              className="max-w-[220px] rounded-md border border-[var(--mpa-color-border-subtle)] bg-white p-3"
              aria-label="Partner portal QR code"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : null}

          <div>
            <h3 className="font-semibold">Property portals</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {propertyPortals.map((row) => (
                <li key={row.id} className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                  <button type="button" className="font-medium underline" onClick={() => {
                    setSelectedPropertyPortalId(row.id);
                    setPropertySlugEdit(row.publicSlug);
                    setPropertyNameEdit(row.publicName);
                  }}>
                    {row.publicName}
                  </button>
                  <div className="text-xs text-[var(--mpa-color-text-muted)]">
                    {row.enabled ? "Enabled" : "Disabled"} · {row.requestCount} requests · {row.canonicalPropertyId ?? row.propertyId}
                  </div>
                  <div className="break-all text-xs">{row.displayUrl}</div>
                </li>
              ))}
              {propertyPortals.length === 0 ? (
                <li className="text-[var(--mpa-color-text-muted)]">No property portals yet.</li>
              ) : null}
            </ul>
            {selectedPropertyPortalId ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <FormField id="admin-property-slug" label="Public property slug">
                  <Input id="admin-property-slug" value={propertySlugEdit} onChange={(event) => setPropertySlugEdit(event.target.value)} />
                </FormField>
                <FormField id="admin-property-name" label="Public display name">
                  <Input id="admin-property-name" value={propertyNameEdit} onChange={(event) => setPropertyNameEdit(event.target.value)} />
                </FormField>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    void (async () => {
                      const response = await fetch("/api/admin/partners/property-portals", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          linkId: selectedPropertyPortalId,
                          publicSlug: propertySlugEdit,
                          publicDisplayName: propertyNameEdit
                        })
                      });
                      const payload = (await response.json()) as { error?: string };
                      if (!response.ok) {
                        setError(payload.error ?? "Could not update the property portal.");
                        return;
                      }
                      if (selected) await loadPropertyPortals(selected.id);
                    })();
                  }}
                >
                  Save property slug / name
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => {
                    const current = propertyPortals.find((row) => row.id === selectedPropertyPortalId);
                    void (async () => {
                      const response = await fetch("/api/admin/partners/property-portals", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          linkId: selectedPropertyPortalId,
                          enabled: !current?.enabled
                        })
                      });
                      if (response.ok && selected) await loadPropertyPortals(selected.id);
                    })();
                  }}
                >
                  Enable / disable intake
                </Button>
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="font-semibold">Referred organizations</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {referrals
                .filter((row) => row.partnerId === selected.id)
                .map((row) => (
                  <li key={row.id}>
                    {row.organizationId}
                    {row.flaggedReason ? ` · flagged: ${row.flaggedReason}` : ""}
                  </li>
                ))}
              {referrals.filter((row) => row.partnerId === selected.id).length === 0 ? (
                <li className="text-[var(--mpa-color-text-muted)]">None yet.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Commission ledger</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {commissions
                .filter((row) => row.partnerId === selected.id)
                .map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-2">
                    <span>
                      {(row.commissionCents / 100).toFixed(2)} at {bpsToPercent(row.commissionBps)}% · month{" "}
                      {row.qualifyingMonthIndex} · {row.status}
                      {row.offsetRequired ? " · offset required" : ""}
                    </span>
                    {row.status === "earned" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => void act("mark_paid", { commissionId: row.id })}
                      >
                        Mark paid
                      </Button>
                    ) : null}
                    {row.status === "pending" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => void act("clear_flag", { commissionId: row.id })}
                      >
                        Clear review
                      </Button>
                    ) : null}
                  </li>
                ))}
              {commissions.filter((row) => row.partnerId === selected.id).length === 0 ? (
                <li className="text-[var(--mpa-color-text-muted)]">No accruals yet.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Audit</h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
              {events
                .filter((row) => row.partnerId === selected.id)
                .slice(0, 12)
                .map((row) => (
                  <li key={row.id}>
                    {row.createdAt}: {row.action}
                  </li>
                ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
