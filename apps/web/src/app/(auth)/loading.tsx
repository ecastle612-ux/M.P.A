import { BrandLogo } from "../../components/branding/brand-logo";

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-6">
      <div className="mpa-brand-loading flex flex-col items-center gap-4 text-center">
        <BrandLogo purpose="loading" priority decorative />
        <p className="text-sm font-medium text-[var(--mpa-color-text-secondary)]">Preparing a secure sign-in…</p>
      </div>
    </main>
  );
}
