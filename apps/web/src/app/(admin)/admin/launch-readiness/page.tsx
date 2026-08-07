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
import { E3CertificationPanel } from "../../../../components/admin/e3-certification-panel";
import { E4CertificationPanel } from "../../../../components/admin/e4-certification-panel";
import { E5CertificationPanel } from "../../../../components/admin/e5-certification-panel";
import { E6CertificationPanel } from "../../../../components/admin/e6-certification-panel";
import { Badge, PageHeader } from "@mpa/ui";

export default function Page() {
  return (
    <main className="space-y-8 p-4 md:p-6">
      <PageHeader
        eyebrow="Certification"
        title="Launch Readiness"
        description="Run evidence scripts for Property Manager, shared platform surfaces, and Facility Operations. Portal provisioning is required for J4 and J6 Pass."
        meta={<Badge variant="success">Aligned</Badge>}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Property Manager · J0–J8
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Customer Promise journeys and operational handoffs.
          </p>
        </div>
        <div className="space-y-4">
          <J0CertificationPanel />
          <J1CertificationPanel />
          <J2CertificationPanel />
          <J3CertificationPanel />
          <J4CertificationPanel />
          <J5CertificationPanel />
          <J6CertificationPanel />
          <J7CertificationPanel />
          <J8CertificationPanel />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Shared Platform
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Documents and Communications evidence across products.
          </p>
        </div>
        <div className="space-y-4">
          <DocumentsCertificationPanel />
          <CommunicationsCertificationPanel />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Facility Operations · E.1–E.6
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Site through inspections, safety, and compliance certification panels.
          </p>
        </div>
        <div className="space-y-4">
          <E1CertificationPanel />
          <E2CertificationPanel />
          <E3CertificationPanel />
          <E4CertificationPanel />
          <E5CertificationPanel />
          <E6CertificationPanel />
        </div>
      </section>
    </main>
  );
}
