"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Avatar, Button, Card, Checkbox, EmptyState, Input, Skeleton } from "@mpa/ui";
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from "../../lib/profile/contracts";

type ProfileState = {
  email: string;
  displayName: string;
  avatarUrl: string;
  phone: string;
  contactEmail: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    roles: string[];
  }>;
};

const EMPTY_PROFILE: ProfileState = {
  email: "",
  displayName: "",
  avatarUrl: "",
  phone: "",
  contactEmail: "",
  timezone: "UTC",
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  memberships: []
};

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        if (isMounted) {
          setError("Could not load profile.");
          setLoading(false);
        }
        return;
      }
      const payload = (await response.json()) as { profile?: ProfileState };
      if (isMounted && payload.profile) {
        setProfile(payload.profile);
      }
      if (isMounted) {
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const avatarFallback = useMemo(() => {
    const source = profile.displayName || profile.email || "MP";
    return source
      .split(" ")
      .filter((segment) => segment.length > 0)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }, [profile.displayName, profile.email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    setSaving(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not save profile.");
      return;
    }
    setNotice("Profile updated.");
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6" aria-busy="true">
        <Skeleton className="h-28" />
        <Skeleton className="h-72" />
        <Skeleton className="h-40" />
      </main>
    );
  }

  return (
    <main className="mpa-page-enter flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 pb-[max(1.5rem,var(--mpa-safe-bottom))] md:p-6">
      <Card className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Settings
        </h1>
        <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          Manage avatar, contact details, timezone, notifications, and organization memberships.
        </p>
      </Card>

      <Card>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <Avatar src={profile.avatarUrl || undefined} fallback={avatarFallback || "MP"} />
            <div>
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                {profile.displayName || "Your profile"}
              </p>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display name" htmlFor="display-name">
              <Input
                id="display-name"
                aria-label="Display name"
                placeholder="Display name"
                value={profile.displayName}
                onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
              />
            </Field>
            <Field label="Avatar URL" htmlFor="avatar-url">
              <Input
                id="avatar-url"
                aria-label="Avatar URL"
                placeholder="https://"
                value={profile.avatarUrl}
                onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))}
              />
            </Field>
            <Field label="Contact email" htmlFor="contact-email">
              <Input
                id="contact-email"
                aria-label="Contact email"
                placeholder="Contact email"
                value={profile.contactEmail}
                onChange={(event) => setProfile((current) => ({ ...current, contactEmail: event.target.value }))}
              />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input
                id="phone"
                aria-label="Phone"
                placeholder="Phone"
                value={profile.phone}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <Field label="Timezone" htmlFor="timezone">
              <Input
                id="timezone"
                aria-label="Timezone"
                placeholder="Timezone (e.g., America/New_York)"
                value={profile.timezone}
                onChange={(event) => setProfile((current) => ({ ...current, timezone: event.target.value }))}
              />
            </Field>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Notification preferences
            </legend>
            {(
              [
                ["email", "Email"],
                ["in_app", "In-app"],
                ["sms", "SMS"]
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 items-center gap-3 text-sm text-[var(--mpa-color-text-secondary)]"
              >
                <Checkbox
                  checked={profile.notificationPreferences[key]}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      notificationPreferences: {
                        ...current.notificationPreferences,
                        [key]: event.target.checked
                      }
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>

          {error ? (
            <p className="text-sm text-[var(--mpa-color-text-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-sm text-[var(--mpa-color-status-success)]" role="status">
              {notice}
            </p>
          ) : null}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Organization memberships
        </h2>
        {profile.memberships.length === 0 ? (
          <EmptyState
            title="No memberships yet"
            description="Create or accept an organization invitation to see memberships here."
            className="bg-[var(--mpa-color-bg-surface-muted)] py-6"
          />
        ) : (
          <ul className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
            {profile.memberships.map((membership) => (
              <li
                key={membership.organizationId}
                className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2"
              >
                {membership.organizationName} ({membership.organizationSlug}) —{" "}
                {membership.roles.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--mpa-color-text-secondary)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
