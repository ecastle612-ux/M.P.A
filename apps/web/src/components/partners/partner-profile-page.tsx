"use client";

import { useEffect, useState } from "react";
import { Button, FormField, Input, Textarea } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";

type Profile = {
  companyName: string;
  partnerTypeLabel: string;
  publicSlug: string | null;
  portalEnabled: boolean;
  portalDescription: string | null;
  phone: string;
  email: string;
  website: string | null;
  serviceArea: string;
  servicesOffered: string;
};

export function PartnerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const [profileResponse, dashboardResponse, logoResponse] = await Promise.all([
        fetch("/api/partners/profile", { signal: controller.signal }),
        fetch("/api/partners/dashboard", { signal: controller.signal }),
        fetch("/api/partners/profile/logo/preview", { signal: controller.signal })
      ]);
      const payload = (await profileResponse.json()) as { profile?: Profile; error?: string };
      const dashboard = (await dashboardResponse.json()) as {
        partner?: { displayStatus?: { label: string } };
      };
      const logo = (await logoResponse.json()) as { logoUrl?: string | null };
      if (controller.signal.aborted) return;
      if (!profileResponse.ok || !payload.profile) {
        setError(payload.error ?? "Could not load partner profile.");
        return;
      }
      setProfile(payload.profile);
      setStatusLabel(dashboard.partner?.displayStatus?.label ?? null);
      setLogoUrl(logo.logoUrl ?? null);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function reload() {
    const [profileResponse, dashboardResponse, logoResponse] = await Promise.all([
      fetch("/api/partners/profile"),
      fetch("/api/partners/dashboard"),
      fetch("/api/partners/profile/logo/preview")
    ]);
    const payload = (await profileResponse.json()) as { profile?: Profile; error?: string };
    const dashboard = (await dashboardResponse.json()) as {
      partner?: { displayStatus?: { label: string } };
    };
    const logo = (await logoResponse.json()) as { logoUrl?: string | null };
    if (!profileResponse.ok || !payload.profile) {
      setError(payload.error ?? "Could not load partner profile.");
      return;
    }
    setProfile(payload.profile);
    setStatusLabel(dashboard.partner?.displayStatus?.label ?? null);
    setLogoUrl(logo.logoUrl ?? null);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const response = await fetch("/api/partners/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalDescription: profile.portalDescription,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        serviceArea: profile.serviceArea,
        servicesOffered: profile.servicesOffered
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not save profile.");
      return;
    }
    setNotice("Profile updated.");
  }

  async function uploadLogo(file: File) {
    setError(null);
    const intent = await fetch("/api/partners/profile/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: file.type || "image/png",
        fileSize: file.size,
        originalFileName: file.name
      })
    });
    const prepared = (await intent.json()) as { mediaId?: string; uploadUrl?: string; error?: string };
    if (!intent.ok || !prepared.mediaId) {
      setError(prepared.error ?? "Could not start logo upload.");
      return;
    }
    if (prepared.uploadUrl && !prepared.uploadUrl.startsWith("signed://")) {
      await fetch(prepared.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/png" }
      });
    }
    const confirm = await fetch("/api/partners/profile/logo/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: prepared.mediaId })
    });
    const confirmed = (await confirm.json()) as { error?: string };
    if (!confirm.ok) {
      setError(confirmed.error ?? "Could not save the logo.");
      return;
    }
    setNotice("Logo updated.");
    await reload();
  }

  return (
    <PartnerCommandCenterShell title="Partner Profile" subtitle="Public and business information for your M.P.A. partnership.">
      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}
      {profile ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium">Company name</dt>
              <dd>{profile.companyName}</dd>
            </div>
            <div>
              <dt className="font-medium">Partner type</dt>
              <dd>{profile.partnerTypeLabel}</dd>
            </div>
            <div>
              <dt className="font-medium">Status</dt>
              <dd>{statusLabel ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Portal slug</dt>
              <dd>{profile.publicSlug ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Portal status</dt>
              <dd>{profile.portalEnabled ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Commission rate, partner type, approval, receiving organization, and payout status are managed by Master Admin.
          </p>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${profile.companyName} logo`} className="h-16 w-16 rounded-md object-contain" />
          ) : null}
          <FormField id="logo" label="Company logo">
            <Input
              id="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadLogo(file);
              }}
            />
          </FormField>
          <FormField id="description" label="Short business description">
            <Textarea
              id="description"
              value={profile.portalDescription ?? ""}
              onChange={(event) => setProfile({ ...profile, portalDescription: event.target.value })}
            />
          </FormField>
          <FormField id="phone" label="Public phone">
            <Input
              id="phone"
              value={profile.phone}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
            />
          </FormField>
          <FormField id="email" label="Public email">
            <Input
              id="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </FormField>
          <FormField id="website" label="Website">
            <Input
              id="website"
              value={profile.website ?? ""}
              onChange={(event) => setProfile({ ...profile, website: event.target.value })}
            />
          </FormField>
          <FormField id="service-area" label="Service area">
            <Input
              id="service-area"
              value={profile.serviceArea}
              onChange={(event) => setProfile({ ...profile, serviceArea: event.target.value })}
            />
          </FormField>
          <FormField id="services" label="Services">
            <Textarea
              id="services"
              value={profile.servicesOffered}
              onChange={(event) => setProfile({ ...profile, servicesOffered: event.target.value })}
            />
          </FormField>
          <Button type="submit" disabled={saving}>
            Save public profile
          </Button>
        </form>
      ) : null}
    </PartnerCommandCenterShell>
  );
}
