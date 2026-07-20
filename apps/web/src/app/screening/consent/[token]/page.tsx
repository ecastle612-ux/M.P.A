import { ScreeningConsentForm } from "../../../../components/screening/screening-consent-form";

export default async function ScreeningConsentPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="min-h-screen bg-[var(--mpa-color-bg)] px-4 py-10">
      <ScreeningConsentForm token={token} />
    </main>
  );
}
