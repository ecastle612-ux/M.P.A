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
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
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
            <label className="block space-y-1 text-sm" htmlFor="profile-display-name">
              <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                Display name
              </span>
              <Input
                id="profile-display-name"
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-1 text-sm" htmlFor="profile-avatar-url">
              <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                Avatar URL
              </span>
              <Input
                id="profile-avatar-url"
                placeholder="https://"
                value={profile.avatarUrl}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, avatarUrl: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-1 text-sm" htmlFor="profile-contact-email">
              <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                Contact email
              </span>
              <Input
                id="profile-contact-email"
                type="email"
                value={profile.contactEmail}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, contactEmail: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-1 text-sm" htmlFor="profile-phone">
              <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Phone</span>
              <Input
                id="profile-phone"
                type="tel"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <label className="block space-y-1 text-sm md:col-span-2" htmlFor="profile-timezone">
              <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                Timezone
              </span>
              <Input
                id="profile-timezone"
                placeholder="e.g., America/New_York"
                value={profile.timezone}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, timezone: event.target.value }))
                }
              />
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Notification preferences
            </legend>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Email and in-app preferences apply to work-order and operational alerts. SMS delivery
              is not available.
            </p>
            <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <Checkbox
                checked={profile.notificationPreferences.email}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    notificationPreferences: {
                      ...current.notificationPreferences,
                      email: event.target.checked,
                      sms: false
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
                      in_app: event.target.checked,
                      sms: false
                    }
                  }))
                }
              />
              In-app
            </label>
          </fieldset>

          {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
          {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}
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
