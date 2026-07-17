"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import { USER_ROLES, isUserRole } from "@mpa/shared";
import { Logo } from "../branding/logo";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../../lib/profile/contracts";
import { INVITE_ROLE_TEMPLATES, SETUP_INVITE_SKIPPED_KEY } from "../../lib/setup/constants";
import type { SetupStatus } from "../../lib/setup/types";
import { SetupStepIndicator } from "./setup-step-indicator";
import { useOrganizationContext } from "../shell/organization-context";

export function SetupWizard({ initialStatus }: { initialStatus: SetupStatus }) {
  const router = useRouter();
  const { refreshOrganizations, organizations } = useOrganizationContext();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("mpa.setup.welcome.v1") !== "true";
  });

  const currentStep = showWelcome ? "welcome" : status.currentStep;

  const refreshStatus = useCallback(async () => {
    const inviteSkipped = window.localStorage.getItem(SETUP_INVITE_SKIPPED_KEY) === "true";
    const response = await fetch(`/api/setup/status?inviteSkipped=${inviteSkipped}`);
    if (!response.ok) return;
    const payload = (await response.json()) as { status?: SetupStatus };
    if (payload.status) setStatus(payload.status);
  }, []);

  useEffect(() => {
    if (status.isComplete && currentStep === "complete") {
      router.replace("/dashboard");
    }
  }, [status.isComplete, currentStep, router]);

  const progressSteps = useMemo(
    () =>
      status.steps
        .filter((step) => !["welcome", "complete"].includes(step.id))
        .map((step) => ({
          id: step.id,
          label: step.label.replace("Create ", "").replace("Add ", "").replace("Complete ", ""),
          complete: step.complete
        })),
    [status.steps]
  );

  return (
    <div className="mpa-page-wide mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-6 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size="loading" priority />
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Welcome to M.P.A.
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Let&apos;s set up your property management company. You&apos;ll always know what comes next.
          </p>
        </div>
      </div>

      <SetupStepIndicator steps={status.steps} currentStepId={currentStep} />

      <Card className="flex-1">
        {currentStep === "welcome" ? (
          <WelcomeStep
            onContinue={() => {
              window.localStorage.setItem("mpa.setup.welcome.v1", "true");
              setShowWelcome(false);
            }}
          />
        ) : null}
        {currentStep === "profile" ? (
          <ProfileStep
            loading={loading}
            error={error}
            onSubmit={async (values) => {
              setLoading(true);
              setError(null);
              const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  displayName: `${values.firstName} ${values.lastName}`.trim(),
                  avatarUrl: values.avatarUrl,
                  phone: values.phone,
                  contactEmail: values.contactEmail,
                  timezone: values.timezone,
                  notificationPreferences: {
                    ...DEFAULT_NOTIFICATION_PREFERENCES,
                    ...(values.jobTitle ? { jobTitle: values.jobTitle } : {})
                  }
                })
              });
              setLoading(false);
              if (!response.ok) {
                setError("Could not save your profile. Please try again.");
                return;
              }
              await refreshStatus();
            }}
          />
        ) : null}
        {currentStep === "organization" ? (
          <OrganizationStep
            loading={loading}
            error={error}
            onSubmit={async (name) => {
              setLoading(true);
              setError(null);
              const response = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
              });
              setLoading(false);
              if (!response.ok) {
                const payload = (await response.json()) as { error?: string };
                setError(payload.error ?? "Could not create organization.");
                return;
              }
              await refreshOrganizations();
              await refreshStatus();
            }}
          />
        ) : null}
        {currentStep === "invite" ? (
          <InviteStep
            organizationId={organizations[0]?.id ?? null}
            loading={loading}
            error={error}
            onSkip={() => {
              window.localStorage.setItem(SETUP_INVITE_SKIPPED_KEY, "true");
              void refreshStatus();
            }}
            onInvited={() => void refreshStatus()}
          />
        ) : null}
        {currentStep === "property" ? (
          <EntityStep
            title="Create your first property"
            description="Add apartments, condos, HOA communities, or commercial buildings."
            primaryHref="/properties/new?setup=1"
            primaryLabel="Create Property →"
          />
        ) : null}
        {currentStep === "units" ? (
          <EntityStep
            title="Add units to your property"
            description="Units represent individual rentable spaces — apartments, suites, or homes."
            primaryHref="/units/new?setup=1"
            primaryLabel="Add Units →"
          />
        ) : null}
        {currentStep === "tenant" ? (
          <EntityStep
            title="Create your first tenant"
            description="Add a resident so you can assign them to a unit and create a lease."
            primaryHref="/tenants/new?setup=1"
            primaryLabel="Create Tenant →"
          />
        ) : null}
        {currentStep === "lease" ? (
          <EntityStep
            title="Create your first lease"
            description="Leases connect tenants to units and unlock rent collection."
            primaryHref="/leases/new?setup=1"
            primaryLabel="Create Lease →"
          />
        ) : null}
        {currentStep === "complete" ? (
          <CompleteStep completionPercent={status.completionPercent} steps={progressSteps} />
        ) : null}
      </Card>
    </div>
  );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">You&apos;re in the right place</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        M.P.A. will guide you through setting up your organization, properties, and first lease. This takes about
        10–15 minutes.
      </p>
      <Button onClick={onContinue}>Get Started →</Button>
    </div>
  );
}

function ProfileStep({
  loading,
  error,
  onSubmit
}: {
  loading: boolean;
  error: string | null;
  onSubmit: (values: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone: string;
    avatarUrl: string;
    contactEmail: string;
    timezone: string;
  }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !jobTitle.trim()) {
      return;
    }
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jobTitle: jobTitle.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim(),
      contactEmail: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Complete your profile</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        We&apos;ll use your name to personalize your workspace — never your email address.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input aria-label="First name" placeholder="First name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <Input aria-label="Last name" placeholder="Last name *" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <Input aria-label="Job title" placeholder="Job title *" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="sm:col-span-2" />
        <Input aria-label="Phone" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input aria-label="Profile photo URL" placeholder="Profile photo URL (optional)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save & Continue →"}
      </Button>
    </form>
  );
}

function OrganizationStep({
  loading,
  error,
  onSubmit
}: {
  loading: boolean;
  error: string | null;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(name.trim());
      }}
    >
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Create your organization</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        This is your property management company — the home for all your properties and team members.
      </p>
      <Input aria-label="Organization name" placeholder="Organization name" value={name} onChange={(e) => setName(e.target.value)} required />
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? "Creating..." : "Create Organization →"}
      </Button>
    </form>
  );
}

function InviteStep({
  organizationId,
  loading,
  error,
  onSkip,
  onInvited
}: {
  organizationId: string | null;
  loading: boolean;
  error: string | null;
  onSkip: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("property_manager");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !isUserRole(role)) return;
    setLocalLoading(true);
    setLocalError(null);
    const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roles: [role] })
    });
    setLocalLoading(false);
    if (!response.ok) {
      setLocalError("Could not send invitation. Check the email and try again.");
      return;
    }
    setEmail("");
    onInvited();
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Invite your team</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Typical property managers invite an assistant manager, leasing agent, or maintenance supervisor. About 30
        seconds per invite.
      </p>
      <div className="flex flex-wrap gap-2">
        {INVITE_ROLE_TEMPLATES.map((template) => (
          <Button key={template.label} type="button" size="sm" variant="secondary" onClick={() => setRole(template.role)}>
            {template.label}
          </Button>
        ))}
      </div>
      <form className="space-y-3" onSubmit={handleInvite}>
        <Input aria-label="Email" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {USER_ROLES.map((userRole) => (
            <option key={userRole} value={userRole}>
              {userRole.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        {(error || localError) ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error ?? localError}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={localLoading || loading || !organizationId}>
            {localLoading ? "Sending..." : "Send Invitation"}
          </Button>
          <Button type="button" variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}

function EntityStep({
  title,
  description,
  primaryHref,
  primaryLabel
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      <Link href={primaryHref}>
        <Button>{primaryLabel}</Button>
      </Link>
    </div>
  );
}

function CompleteStep({
  completionPercent,
  steps
}: {
  completionPercent: number;
  steps: Array<{ id: string; label: string; complete: boolean }>;
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-2xl text-white">
        ✓
      </div>
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Setup complete!</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Your portfolio is ready. Head to the Operations Center to manage daily operations.
      </p>
      <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">{completionPercent}% portfolio setup</p>
      <ul className="mx-auto max-w-sm space-y-1 text-left text-sm">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2">
            <span aria-hidden>{step.complete ? "✓" : "○"}</span>
            {step.label}
          </li>
        ))}
      </ul>
      <Link href="/dashboard">
        <Button>Open Operations Center →</Button>
      </Link>
    </div>
  );
}
