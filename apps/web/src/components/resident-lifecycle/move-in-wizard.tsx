"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea, useToast } from "@mpa/ui";
import type { ApplicantListItem } from "../../lib/applicant/server";
import type { MoveInChecklist } from "../../lib/resident-lifecycle/contracts";
import { emptyMoveInChecklist } from "../../lib/resident-lifecycle/contracts";
import { readApiError } from "../../lib/api/client-error";
import { Field } from "./field";

type PropertyOption = { id: string; name: string };
type UnitOption = {
  id: string;
  propertyId: string;
  unitNumber: string;
  unitLabel: string | null;
  occupancyStatus: string;
  rentAmount: number | null;
  depositAmount: number | null;
};

const STEPS = ["Source", "Unit", "Details", "Checklist", "Activate"] as const;

const CHECKLIST_LABELS: Array<{ key: keyof MoveInChecklist; label: string }> = [
  { key: "screeningComplete", label: "Background screening complete" },
  { key: "leaseGenerated", label: "Lease generated" },
  { key: "leaseSigned", label: "Lease signed" },
  { key: "depositReceived", label: "Deposit received" },
  { key: "portalReady", label: "Resident portal ready" },
  { key: "welcomeEmail", label: "Welcome email" },
  { key: "welcomeSms", label: "Welcome SMS (if enabled)" },
  { key: "pushEnabled", label: "Push notifications enabled" },
  { key: "documentsUploaded", label: "Required documents uploaded" }
];

export function MoveInWizard({
  applicants,
  properties,
  units,
  canOverrideOccupied,
  initialPropertyId,
  initialUnitId,
  initialApplicantId
}: {
  applicants: ApplicantListItem[];
  properties: PropertyOption[];
  units: UnitOption[];
  canOverrideOccupied: boolean;
  initialPropertyId?: string;
  initialUnitId?: string;
  initialApplicantId?: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const resolvedInitialApplicant = initialApplicantId
    ? applicants.find((applicant) => applicant.id === initialApplicantId)
    : undefined;
  const resolvedInitialUnit = initialUnitId
    ? units.find((unit) => unit.id === initialUnitId)
    : resolvedInitialApplicant?.unitId
      ? units.find((unit) => unit.id === resolvedInitialApplicant.unitId)
      : undefined;
  const [step, setStep] = useState(resolvedInitialApplicant || resolvedInitialUnit ? 1 : 0);
  const [invitationSent, setInvitationSent] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [source, setSource] = useState<"applicant" | "direct">(
    resolvedInitialApplicant ? "applicant" : resolvedInitialUnit ? "direct" : "applicant"
  );
  const [applicantId, setApplicantId] = useState(resolvedInitialApplicant?.id ?? "");
  const [propertyId, setPropertyId] = useState(
    initialPropertyId ??
      resolvedInitialApplicant?.propertyId ??
      resolvedInitialUnit?.propertyId ??
      ""
  );
  const [unitId, setUnitId] = useState(
    resolvedInitialUnit?.id ?? resolvedInitialApplicant?.unitId ?? ""
  );
  const [overrideOccupied, setOverrideOccupied] = useState(false);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaseEndDate, setLeaseEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [pets, setPets] = useState("");
  const [vehicles, setVehicles] = useState("");
  const [coResidents, setCoResidents] = useState("");
  const [guarantors, setGuarantors] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<MoveInChecklist>(emptyMoveInChecklist());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneTenantId, setDoneTenantId] = useState<string | null>(null);

  const eligibleApplicants = useMemo(
    () => applicants.filter((applicant) => !applicant.tenantId && applicant.status === "approved"),
    [applicants]
  );

  const propertyUnits = useMemo(
    () => units.filter((unit) => unit.propertyId === propertyId),
    [units, propertyId]
  );

  const selectedUnit = propertyUnits.find((unit) => unit.id === unitId) ?? null;
  const occupied = selectedUnit?.occupancyStatus === "occupied";

  useEffect(() => {
    if (!applicantId || source !== "applicant") return;
    const applicant = applicants.find((item) => item.id === applicantId);
    if (!applicant) return;
    setFirstName(applicant.firstName);
    setLastName(applicant.lastName);
    setEmail(applicant.email);
    setPhone(applicant.phone ?? "");
    setEmergencyContactName(applicant.profile.emergency.name ?? "");
    setEmergencyContactPhone(applicant.profile.emergency.phone ?? "");
    if (applicant.plannedMoveInDate) {
      setMoveInDate(applicant.plannedMoveInDate);
      setLeaseStartDate(applicant.plannedMoveInDate);
    }
    if (applicant.propertyId) setPropertyId(applicant.propertyId);
    if (applicant.unitId) setUnitId(applicant.unitId);
    setPets(
      applicant.profile.pets
        .map((pet) => `${pet.species ?? "Pet"} ${pet.name ?? ""}`.trim())
        .filter(Boolean)
        .join(", ")
    );
    setVehicles(
      applicant.profile.vehicles
        .map((vehicle) => `${vehicle.make ?? ""} ${vehicle.model ?? ""} ${vehicle.licensePlate ?? ""}`.trim())
        .filter(Boolean)
        .join(", ")
    );
    setCoResidents(
      applicant.profile.householdMembers
        .map((member) => `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim())
        .filter(Boolean)
        .join(", ")
    );
  }, [applicantId, applicants, source]);

  useEffect(() => {
    if (!selectedUnit) return;
    if (selectedUnit.rentAmount != null) setRentAmount(String(selectedUnit.rentAmount));
    if (selectedUnit.depositAmount != null) setSecurityDeposit(String(selectedUnit.depositAmount));
  }, [selectedUnit]);

  useEffect(() => {
    if (!leaseStartDate || leaseEndDate) return;
    const start = new Date(`${leaseStartDate}T00:00:00.000Z`);
    start.setUTCFullYear(start.getUTCFullYear() + 1);
    setLeaseEndDate(start.toISOString().slice(0, 10));
  }, [leaseStartDate, leaseEndDate]);

  async function loadUnitPreview() {
    if (!propertyId || !unitId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/resident-lifecycle/move-in?propertyId=${encodeURIComponent(propertyId)}&unitId=${encodeURIComponent(unitId)}`,
        { cache: "no-store" }
      );
      const json = (await response.json()) as {
        preview?: { occupiedBlocked: boolean; hasActiveLease: boolean; unit: { occupancyStatus: string } };
      };
      if (!response.ok) throw new Error(readApiError(json, "Could not load unit details"));
      if (json.preview?.occupiedBlocked) {
        setPreviewNote(
          json.preview.hasActiveLease
            ? "This unit has an active lease. Override required to continue."
            : "This unit is marked occupied. Override required to continue."
        );
      } else {
        setPreviewNote(`Unit is ${json.preview?.unit.occupancyStatus ?? "available"} and ready for assignment.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load unit details");
    } finally {
      setLoading(false);
    }
  }

  function canAdvance(): boolean {
    if (step === 0) {
      if (source === "applicant") return Boolean(applicantId);
      return true;
    }
    if (step === 1) {
      if (!propertyId || !unitId) return false;
      if (occupied && !(overrideOccupied && canOverrideOccupied)) return false;
      return true;
    }
    if (step === 2) {
      return (
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        email.includes("@") &&
        Boolean(moveInDate) &&
        Boolean(leaseStartDate) &&
        Boolean(leaseEndDate) &&
        Number(rentAmount) >= 0 &&
        Number(securityDeposit) >= 0
      );
    }
    return true;
  }

  async function goNext() {
    setError(null);
    if (step === 1) await loadUnitPreview();
    if (step === 2) {
      setChecklist((current) => ({
        ...current,
        leaseGenerated: true,
        leaseSigned: true,
        screeningComplete: source === "applicant" ? current.screeningComplete || true : current.screeningComplete,
        documentsUploaded: source === "applicant" ? current.documentsUploaded || true : current.documentsUploaded,
        depositReceived: Number(securityDeposit) === 0 ? true : current.depositReceived
      }));
    }
    if (!canAdvance()) {
      setError("Complete the required fields before continuing.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/resident-lifecycle/move-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          applicantId: source === "applicant" ? applicantId : null,
          propertyId,
          unitId,
          overrideOccupied,
          firstName,
          lastName,
          email,
          phone: phone || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          moveInDate,
          leaseStartDate,
          leaseEndDate,
          rentAmount: Number(rentAmount),
          securityDeposit: Number(securityDeposit || 0),
          pets: pets || null,
          vehicles: vehicles || null,
          coResidents: coResidents || null,
          guarantors: guarantors || null,
          notes: notes || null,
          sendWelcome: true,
          activateLease: true
        })
      });
      const json = (await response.json()) as {
        result?: {
          tenant: { id: string };
          checklist: MoveInChecklist;
          invitationSent?: boolean;
          welcomeSent?: boolean;
        };
      };
      if (!response.ok) throw new Error(readApiError(json, "Move-in failed"));
      if (json.result?.checklist) setChecklist(json.result.checklist);
      setInvitationSent(Boolean(json.result?.invitationSent));
      setWelcomeSent(Boolean(json.result?.welcomeSent));
      setDoneTenantId(json.result?.tenant.id ?? null);
      notify({
        title: "Resident activated",
        description: "Occupancy, lease, and timeline updated automatically.",
        variant: "success"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move-in failed");
    } finally {
      setLoading(false);
    }
  }

  if (doneTenantId) {
    return (
      <Card className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Resident activated
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Lease linked, occupancy updated, and lifecycle events recorded.
          {invitationSent
            ? " Portal invitation sent."
            : " Portal invite may already be pending — use Bulk residents if you need to resend."}
          {welcomeSent ? " Welcome notification queued." : ""}
        </p>
        <ChecklistPanel
          checklist={checklist}
          onToggle={(key) => setChecklist((current) => ({ ...current, [key]: !current[key] }))}
        />
        <div className="flex flex-wrap gap-2">
          <Link href={`/tenants/${doneTenantId}`}>
            <Button>View resident</Button>
          </Link>
          {!invitationSent ? (
            <Link href="/residents/bulk">
              <Button variant="secondary">Send portal invite</Button>
            </Link>
          ) : null}
          <Link href="/dashboard">
            <Button variant="secondary">Operations Center</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              router.refresh();
              setDoneTenantId(null);
              setStep(0);
            }}
          >
            Move in another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Resident move-in
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Guided activation — applicant conversion or direct resident creation in one flow.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Move-in steps">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${
              index === step
                ? "bg-[var(--mpa-color-brand-primary)] text-white"
                : index < step
                  ? "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-primary)]"
                  : "border border-[var(--mpa-color-border)] text-[var(--mpa-color-text-secondary)]"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

      {step === 0 ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`rounded-lg border p-4 text-left ${
                source === "applicant"
                  ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]"
                  : "border-[var(--mpa-color-border)]"
              }`}
              onClick={() => setSource("applicant")}
            >
              <div className="font-medium">Existing applicant</div>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Auto-fill from the approved application.
              </p>
            </button>
            <button
              type="button"
              className={`rounded-lg border p-4 text-left ${
                source === "direct"
                  ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]"
                  : "border-[var(--mpa-color-border)]"
              }`}
              onClick={() => setSource("direct")}
            >
              <div className="font-medium">Create resident directly</div>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Skip application when the resident is already known.
              </p>
            </button>
          </div>
          {source === "applicant" ? (
            eligibleApplicants.length === 0 ? (
              <div className="rounded-lg border border-[var(--mpa-color-border)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
                No approved applicants are ready to convert.{" "}
                <Link href="/applicants" className="text-[var(--mpa-color-brand-primary)]">
                  Review applicants
                </Link>{" "}
                or choose “Create resident directly.”
              </div>
            ) : (
              <Field label="Applicant">
                <Select
                  aria-label="Applicant"
                  value={applicantId}
                  onChange={(event) => setApplicantId(event.target.value)}
                >
                  <option value="">Select applicant…</option>
                  {eligibleApplicants.map((applicant) => (
                    <option key={applicant.id} value={applicant.id}>
                      {applicant.firstName} {applicant.lastName} · {applicant.email}
                    </option>
                  ))}
                </Select>
              </Field>
            )
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <Field label="Property">
            <Select
              aria-label="Property"
              value={propertyId}
              onChange={(event) => {
                setPropertyId(event.target.value);
                setUnitId("");
              }}
            >
              <option value="">Select property…</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unit">
            <Select
              aria-label="Unit"
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              disabled={!propertyId}
            >
              <option value="">Select unit…</option>
              {propertyUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unitNumber}
                  {unit.unitLabel ? ` · ${unit.unitLabel}` : ""} · {unit.occupancyStatus}
                  {unit.rentAmount != null ? ` · $${unit.rentAmount}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          {selectedUnit ? (
            <div className="rounded-lg border border-[var(--mpa-color-border)] p-3 text-sm">
              <p>Occupancy: {selectedUnit.occupancyStatus}</p>
              <p>Rent: {selectedUnit.rentAmount != null ? `$${selectedUnit.rentAmount}` : "Not set"}</p>
              <p>Deposit: {selectedUnit.depositAmount != null ? `$${selectedUnit.depositAmount}` : "Not set"}</p>
              {previewNote ? <p className="mt-2 text-[var(--mpa-color-text-secondary)]">{previewNote}</p> : null}
            </div>
          ) : null}
          {occupied ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={overrideOccupied}
                disabled={!canOverrideOccupied}
                onChange={(event) => setOverrideOccupied(event.target.checked)}
              />
              <span>
                Override occupied unit
                {!canOverrideOccupied ? " (requires lease update permission)" : ""}
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name">
            <Input aria-label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          </Field>
          <Field label="Last name">
            <Input aria-label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </Field>
          <Field label="Email">
            <Input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Phone">
            <Input aria-label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <Field label="Move-in date">
            <Input
              aria-label="Move-in date"
              type="date"
              value={moveInDate}
              onChange={(event) => setMoveInDate(event.target.value)}
            />
          </Field>
          <Field label="Lease start">
            <Input
              aria-label="Lease start"
              type="date"
              value={leaseStartDate}
              onChange={(event) => setLeaseStartDate(event.target.value)}
            />
          </Field>
          <Field label="Lease end">
            <Input
              aria-label="Lease end"
              type="date"
              value={leaseEndDate}
              onChange={(event) => setLeaseEndDate(event.target.value)}
            />
          </Field>
          <Field label="Monthly rent">
            <Input
              aria-label="Monthly rent"
              type="number"
              value={rentAmount}
              onChange={(event) => setRentAmount(event.target.value)}
            />
          </Field>
          <Field label="Security deposit">
            <Input
              aria-label="Security deposit"
              type="number"
              value={securityDeposit}
              onChange={(event) => setSecurityDeposit(event.target.value)}
            />
          </Field>
          <Field label="Emergency contact">
            <Input
              aria-label="Emergency contact"
              value={emergencyContactName}
              onChange={(event) => setEmergencyContactName(event.target.value)}
            />
          </Field>
          <Field label="Emergency phone">
            <Input
              aria-label="Emergency phone"
              value={emergencyContactPhone}
              onChange={(event) => setEmergencyContactPhone(event.target.value)}
            />
          </Field>
          <Field label="Pets">
            <Input aria-label="Pets" value={pets} onChange={(event) => setPets(event.target.value)} />
          </Field>
          <Field label="Vehicles">
            <Input aria-label="Vehicles" value={vehicles} onChange={(event) => setVehicles(event.target.value)} />
          </Field>
          <Field label="Co-residents">
            <Input
              aria-label="Co-residents"
              value={coResidents}
              onChange={(event) => setCoResidents(event.target.value)}
            />
          </Field>
          <Field label="Guarantors">
            <Input aria-label="Guarantors" value={guarantors} onChange={(event) => setGuarantors(event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea aria-label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Confirm readiness. Missing items stay highlighted — you can still activate and finish remaining work after.
          </p>
          <ChecklistPanel
            checklist={checklist}
            onToggle={(key) => setChecklist((current) => ({ ...current, [key]: !current[key] }))}
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            Activating will create/link the resident and lease, update occupancy, send the portal invitation, queue a
            welcome notification, and write timeline/audit events — without manual linking.
          </p>
          <ChecklistPanel checklist={checklist} />
        </div>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" disabled={step === 0 || loading} onClick={() => setStep((current) => current - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={loading} onClick={() => void goNext()}>
            Continue
          </Button>
        ) : (
          <Button disabled={loading} onClick={() => void activate()}>
            {loading ? "Activating…" : "Activate resident"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function ChecklistPanel({
  checklist,
  onToggle
}: {
  checklist: MoveInChecklist;
  onToggle?: (key: keyof MoveInChecklist) => void;
}) {
  return (
    <ul className="space-y-2">
      {CHECKLIST_LABELS.map((item) => {
        const done = checklist[item.key];
        const content = (
          <>
            <span aria-hidden>{done ? "☑" : "☐"}</span>
            <span>{item.label}</span>
            {!done ? <span className="ml-auto text-xs text-[var(--mpa-color-danger)]">Missing</span> : null}
          </>
        );
        return (
          <li key={item.key}>
            {onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(item.key)}
                className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${
                  done
                    ? "border-[var(--mpa-color-border)] text-[var(--mpa-color-text-primary)]"
                    : "border-[var(--mpa-color-danger)]/40 bg-[var(--mpa-color-danger)]/5 text-[var(--mpa-color-text-primary)]"
                }`}
              >
                {content}
              </button>
            ) : (
              <div
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  done
                    ? "border-[var(--mpa-color-border)] text-[var(--mpa-color-text-primary)]"
                    : "border-[var(--mpa-color-danger)]/40 bg-[var(--mpa-color-danger)]/5 text-[var(--mpa-color-text-primary)]"
                }`}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
