/** Client-safe Owner settings presentation types (no server imports). */

export type OwnerSettingsProfile = {
  displayName: string;
  email: string;
  organizationName: string;
  roleLabels: string[];
  timezone: string;
  languageCode: string | null;
};

export type OwnerSettingsSecurity = {
  lastSignInLabel: string | null;
  mfaStatusLabel: string;
  passwordChangeHref: string;
  profileEditHref: string;
};

export type OwnerSettingsAbout = {
  mpaVersion: string;
  portalVersion: string;
  helpLinks: Array<{ href: string; label: string; description: string }>;
};
