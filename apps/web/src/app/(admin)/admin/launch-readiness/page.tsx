import { J0CertificationPanel } from "../../../../components/admin/j0-certification-panel";
import { J1CertificationPanel } from "../../../../components/admin/j1-certification-panel";
import { J2CertificationPanel } from "../../../../components/admin/j2-certification-panel";
import { J3CertificationPanel } from "../../../../components/admin/j3-certification-panel";
import { J4CertificationPanel } from "../../../../components/admin/j4-certification-panel";
import { J5CertificationPanel } from "../../../../components/admin/j5-certification-panel";
import { J6CertificationPanel } from "../../../../components/admin/j6-certification-panel";
import { J7CertificationPanel } from "../../../../components/admin/j7-certification-panel";
import { J8CertificationPanel } from "../../../../components/admin/j8-certification-panel";
import { DocumentsCertificationPanel } from "../../../../components/admin/documents-certification-panel";
import { CommunicationsCertificationPanel } from "../../../../components/admin/communications-certification-panel";
import { E1CertificationPanel } from "../../../../components/admin/e1-certification-panel";
import { E2CertificationPanel } from "../../../../components/admin/e2-certification-panel";

export default function Page() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <section className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Launch Readiness
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Customer Promise launch evidence. J0–J8 verification scripts plus Documents and
          Communications remediation. Portal access provisioning is required for J4/J6 Pass.
          Facility Operations Phase E.1 certification is included below.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: aligned
        </p>
      </section>
      <J0CertificationPanel />
      <J1CertificationPanel />
      <J2CertificationPanel />
      <J3CertificationPanel />
      <J4CertificationPanel />
      <J5CertificationPanel />
      <J6CertificationPanel />
      <J7CertificationPanel />
      <J8CertificationPanel />
      <DocumentsCertificationPanel />
      <CommunicationsCertificationPanel />
      <E1CertificationPanel />
      <E2CertificationPanel />
    </main>
  );
}
