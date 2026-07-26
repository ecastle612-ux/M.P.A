import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import { AppearanceSettingsPanel } from "../settings/appearance-settings-panel";
import { NotificationPreferencesForm } from "../communication/notification-preferences-form";
import {
  OwnerFoundationNote,
  OwnerSectionHeader
} from "./owner-section-placeholder";
import type { OwnerSettingsExperienceModel } from "../../lib/owner-portal/settings-experience";

function SettingsSection({
  id,
  title,
  description,
  children
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3 scroll-mt-20">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}

export function OwnerSettingsExperience({ model }: { model: OwnerSettingsExperienceModel }) {
  const { profile, security, about } = model;

  return (
    <div className="space-y-6">
      <OwnerSectionHeader
        title="Settings"
        description="Your profile, notification preferences, and account security. No organization admin tools."
      />
      <OwnerFoundationNote>
        Settings show only your account information for the active organization. Editing uses existing
        shared surfaces — no new preference storage or admin capabilities.
      </OwnerFoundationNote>

      <nav aria-label="Settings sections" className="flex flex-wrap gap-2 text-xs">
        {[
          { href: "#profile", label: "Profile" },
          { href: "#notifications", label: "Notifications" },
          { href: "#security", label: "Security" },
          { href: "#preferences", label: "Preferences" },
          { href: "#about", label: "About" }
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-full bg-[var(--mpa-color-bg-surface-muted)] px-3 py-1 font-medium text-[var(--mpa-color-text-secondary)] hover:text-[var(--mpa-color-text-primary)]"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <SettingsSection
        id="profile"
        title="Profile"
        description="Information from your existing profile and organization membership."
      >
        <Card variant="elevated" className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Name" value={profile.displayName} />
            <ProfileField label="Email" value={profile.email} />
            <ProfileField label="Organization" value={profile.organizationName} />
            <div className="space-y-1">
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">Role</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.roleLabels.map((role) => (
                  <Badge key={role} variant="neutral">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs">
            <Link
              href={security.profileEditHref}
              className="font-medium text-[var(--mpa-color-text-link)] underline"
            >
              Edit profile
            </Link>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {" "}
              — name, contact details, photo, and timezone on the shared profile surface.
            </span>
          </p>
        </Card>
      </SettingsSection>

      <SettingsSection
        id="notifications"
        title="Notifications"
        description="Personal notification preferences for your account in this organization."
      >
        {model.notificationPreferencesNote ? (
          <Card variant="muted" className="p-4">
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {model.notificationPreferencesNote}
            </p>
          </Card>
        ) : null}
        {model.notificationPreferencesAvailable ? (
          <NotificationPreferencesForm initialPreferences={model.notificationPreferences} />
        ) : null}
      </SettingsSection>

      <SettingsSection
        id="security"
        title="Security"
        description="Sign-in and account protection using existing authentication flows."
      >
        <Card variant="elevated" className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              label="Last sign-in"
              value={security.lastSignInLabel ?? "Not available for this session."}
            />
            <div className="space-y-1">
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">Multi-factor authentication</p>
              <p className="text-sm text-[var(--mpa-color-text-primary)]">{security.mfaStatusLabel}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Password</p>
            <p className="text-sm text-[var(--mpa-color-text-primary)]">
              Change your password through the existing secure recovery flow.
            </p>
            <p className="text-xs">
              <Link
                href={security.passwordChangeHref}
                className="font-medium text-[var(--mpa-color-text-link)] underline"
              >
                Reset password
              </Link>
            </p>
          </div>
        </Card>
      </SettingsSection>

      <SettingsSection
        id="preferences"
        title="Preferences"
        description="Existing theme and locale preferences — no new preference storage."
      >
        <div className="space-y-3">
          <AppearanceSettingsPanel />
          <Card variant="elevated" className="space-y-3 p-4">
            <ProfileField label="Time zone" value={profile.timezone} />
            <ProfileField
              label="Language"
              value={
                profile.languageCode
                  ? profile.languageCode.toUpperCase()
                  : "Not set — configure with notification preferences or profile defaults."
              }
            />
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Time zone is edited on{" "}
              <Link href="/profile" className="text-[var(--mpa-color-text-link)] underline">
                Profile
              </Link>
              . Language follows the existing notification preference model when saved.
            </p>
          </Card>
        </div>
      </SettingsSection>

      <SettingsSection
        id="about"
        title="About"
        description="Product and Owner Portal version information."
      >
        <Card variant="elevated" className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="M.P.A. version" value={about.mpaVersion} />
            <ProfileField label="Owner Portal" value={about.portalVersion} />
          </div>
          <ul className="space-y-2">
            {about.helpLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-[var(--mpa-color-text-link)] underline"
                >
                  {link.label}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">{link.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </SettingsSection>
    </div>
  );
}
