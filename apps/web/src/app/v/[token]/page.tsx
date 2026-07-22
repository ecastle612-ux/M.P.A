import { VendorJobCardView } from "../../../components/vendor-jobs/vendor-job-card";
import { getVendorJobCard } from "../../../lib/vendor-jobs/server";

export default async function VendorTokenJobPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let job = null;
  let errorMessage: string | null = null;
  try {
    job = await getVendorJobCard(token);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "This job link is unavailable.";
  }

  return (
    <main className="mpa-page min-h-screen bg-[var(--mpa-color-bg-canvas)] px-4 py-8">
      <div className="mx-auto mb-6 max-w-lg text-center">
        <p className="text-sm font-semibold tracking-wide text-[var(--mpa-color-brand-primary)]">M.P.A.</p>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">Vendor job access — no login required</p>
      </div>

      {job ? (
        <VendorJobCardView token={token} initialJob={job} />
      ) : (
        <div className="mx-auto max-w-lg rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-6">
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Link unavailable</h1>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            {errorMessage ?? "Ask the property manager for a new job link or QR code."}
          </p>
        </div>
      )}
    </main>
  );
}
