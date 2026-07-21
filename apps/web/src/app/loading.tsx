import { BrandLogo } from "../components/branding/brand-logo";

export default function GlobalLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-6">
      <div className="mpa-brand-loading">
        <BrandLogo purpose="loading" priority />
      </div>
    </main>
  );
}
