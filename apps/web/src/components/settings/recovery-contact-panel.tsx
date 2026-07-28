"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";
import { useOrganizationContext } from "../shell/organization-context";

type RecoveryContact = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  verifiedAt: string | null;
  orgAdminAcknowledgedAt: string | null;
  isReady: boolean;
};

export function RecoveryContactPanel({
  canUpdate,
  onChanged
}: {
  canUpdate: boolean;
  /** Called after save / verify / activate so parent surfaces can refresh setup status. */
  onChanged?: () => void;
}) {
  const { activeOrganization } = useOrganizationContext();
  const [contact, setContact] = useState<RecoveryContact | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    if (!activeOrganization) return;
    const response = await fetch(`/api/organizations/${activeOrganization.id}/recovery-contact`);
    if (!response.ok) return;
    const payload = (await response.json()) as { contact?: RecoveryContact | null };
    const next = payload.contact ?? null;
    setContact(next);
    if (next) {
      setFullName(next.fullName);
      setEmail(next.email);
      setPhone(next.phone ?? "");
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization?.id]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!activeOrganization || !canUpdate) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/organizations/${activeOrganization.id}/recovery-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert",
        fullName,
        email,
        phone,
        acknowledge: true
      })
    });
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
      verificationSent?: boolean;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to save recovery contact");
      return;
    }
    await refresh();
    setNotice(
      payload.verificationSent
        ? "Recovery contact saved. Verification code sent to the contact email."
        : "Recovery contact updated."
    );
    onChanged?.();
  }

  async function verify() {
    if (!activeOrganization || !canUpdate) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/organizations/${activeOrganization.id}/recovery-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", token: verifyToken })
    });
    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Verification failed");
      return;
    }
    setVerifyToken("");
    await refresh();
    setNotice("Recovery contact verified.");
    onChanged?.();
  }

  async function activateOrganization() {
    if (!activeOrganization || !canUpdate) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/organizations/${activeOrganization.id}/activate`, {
      method: "POST"
    });
    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to activate organization");
      return;
    }
    setNotice("Organization commercial status is now active.");
    onChanged?.();
  }

  if (!activeOrganization) return null;

  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold">Secondary recovery contact</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Required before the organization can become commercially active. The recovery contact is not
        automatically an Organization Administrator.
      </p>
      <form className="grid gap-2 md:grid-cols-2" onSubmit={(event) => void save(event)}>
        <Input
          aria-label="Recovery contact name"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={!canUpdate || loading}
          required
        />
        <Input
          aria-label="Recovery contact email"
          type="email"
          placeholder="recovery@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={!canUpdate || loading}
          required
        />
        <Input
          aria-label="Recovery contact phone"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={!canUpdate || loading}
        />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canUpdate || loading}>
            Save & acknowledge
          </Button>
        </div>
      </form>
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        Status:{" "}
        {contact?.isReady
          ? "Ready (verified + acknowledged)"
          : contact?.verifiedAt
            ? "Verified — acknowledgment pending"
            : contact
              ? "Saved — verification pending"
              : "Not configured"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Verification code"
          placeholder="Verification code from email"
          value={verifyToken}
          onChange={(event) => setVerifyToken(event.target.value)}
          disabled={!canUpdate || loading}
        />
        <Button type="button" variant="secondary" disabled={!canUpdate || loading} onClick={() => void verify()}>
          Verify code
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canUpdate || loading || !contact?.isReady}
          onClick={() => void activateOrganization()}
        >
          Mark organization active
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
    </Card>
  );
}
