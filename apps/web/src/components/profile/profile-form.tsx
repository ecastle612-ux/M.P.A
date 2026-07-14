"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Avatar, Button, Card, Checkbox, Input } from "@mpa/ui";
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
      <Card>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading profile...</p>
      </Card>
    );
  }

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Card>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">User profile</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Manage avatar, contact details, timezone, notifications, and organization memberships.
        </p>
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <Avatar src={profile.avatarUrl || undefined} fallback={avatarFallback || "MP"} />
            <div className="text-sm text-[var(--mpa-color-text-secondary)]">{profile.email}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              aria-label="Display name"
              placeholder="Display name"
              value={profile.displayName}
              onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            />
            <Input
              aria-label="Avatar URL"
              placeholder="Avatar URL"
              value={profile.avatarUrl}
              onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))}
            />
            <Input
              aria-label="Contact email"
              placeholder="Contact email"
              value={profile.contactEmail}
              onChange={(event) => setProfile((current) => ({ ...current, contactEmail: event.target.value }))}
            />
            <Input
              aria-label="Phone"
              placeholder="Phone"
              value={profile.phone}
              onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
            />
            <Input
              aria-label="Timezone"
              placeholder="Timezone (e.g., America/New_York)"
              value={profile.timezone}
              onChange={(event) => setProfile((current) => ({ ...current, timezone: event.target.value }))}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Notification preferences
            </legend>
            <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <Checkbox
                checked={profile.notificationPreferences.email}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    notificationPreferences: {
                      ...current.notificationPreferences,
                      email: event.target.checked
                    }
                  }))
                }
              />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <Checkbox
                checked={profile.notificationPreferences.in_app}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    notificationPreferences: {
                      ...current.notificationPreferences,
                      in_app: event.target.checked
                    }
                  }))
                }
              />
              In-app
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <Checkbox
                checked={profile.notificationPreferences.sms}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    notificationPreferences: {
                      ...current.notificationPreferences,
                      sms: event.target.checked
                    }
                  }))
                }
              />
              SMS
            </label>
          </fieldset>

          {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
          {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Organization memberships</h2>
        {profile.memberships.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">No memberships yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {profile.memberships.map((membership) => (
              <li key={membership.organizationId}>
                {membership.organizationName} ({membership.organizationSlug}) — {membership.roles.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
