export const SETUP_STEPS = [
  "welcome",
  "profile",
  "organization",
  "invite",
  "property",
  "units",
  "tenant",
  "lease",
  "complete"
] as const;

export type SetupStep = (typeof SETUP_STEPS)[number];

export const SETUP_STEP_LABELS: Record<SetupStep, string> = {
  welcome: "Welcome",
  profile: "Complete Profile",
  organization: "Create Organization",
  invite: "Invite Team",
  property: "Create Property",
  units: "Add Units",
  tenant: "Create First Tenant",
  lease: "Create First Lease",
  complete: "Setup Complete"
};

export const SETUP_INVITE_SKIPPED_KEY = "mpa.setup.invite-skipped.v1";
export const SETUP_COMPLETE_DISMISSED_KEY = "mpa.setup.complete-dismissed.v1";

export const INVITE_ROLE_TEMPLATES = [
  { label: "Assistant Manager", role: "property_manager" as const },
  { label: "Leasing Agent", role: "property_manager" as const },
  { label: "Maintenance Manager", role: "property_manager" as const },
  { label: "Property Owner", role: "property_owner" as const },
  { label: "Vendor", role: "vendor" as const }
];
