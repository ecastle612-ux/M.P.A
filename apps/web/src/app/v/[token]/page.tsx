import { VendorJobCardView } from "../../../components/vendor-jobs/vendor-job-card";
import { RoleUniversalDashboard } from "../../../components/dashboard-framework/role-universal-dashboard";
import { getVendorJobCard } from "../../../lib/vendor-jobs/server";
import { buildVendorDashboardViewModel } from "../../../lib/dashboard/ux016-role-builders";
import { getTimeGreeting } from "../../../lib/format/display-labels";

export default async function VendorTokenJobPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let job = null;
  let errorMessage: string | null = null;
  try {
    job = await getVendorJobCard(token);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "This job link is unavailable.";
  }

  const model = job
    ? buildVendorDashboardViewModel({
        timeGreeting: getTimeGreeting(),
        dateLabel: new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }).format(new Date()),
        token,
        job
      })
    : null;

  return (
    <main className="mpa-page mpa-native-shell min-h-[100dvh] min-h-screen bg-[var(--mpa-color-bg-canvas)] px-4 py-8 pt-[calc(2rem+var(--mpa-safe-top))] pb-[calc(2rem+var(--mpa-safe-bottom))] pl-[max(1rem,var(--mpa-safe-left))] pr-[max(1rem,var(--mpa-safe-right))]">
      <div className="mx-auto mb-6 max-w-lg text-center">
        <p className="text-sm font-semibold tracking-wide text-[var(--mpa-color-brand-primary)]">M.P.A.</p>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">Vendor job access — no login required</p>
      </div>

      {job && model ? (
        <div className="mx-auto max-w-lg space-y-6">
          <RoleUniversalDashboard model={model} />
          <VendorJobCardView token={token} initialJob={job} />
        </div>
      ) : (
        <div className="mx-auto max-w-lg rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-6">
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Link unavailable</h1>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            {errorMessage ?? "Ask the property manager for a new job link or QR code."}
          </p>
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
            This page is your job companion. When the link is valid, Immediate Attention will show the next step.
          </p>
        </div>
      )}
    </main>
  );
}
