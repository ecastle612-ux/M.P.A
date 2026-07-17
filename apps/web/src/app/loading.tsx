import { Logo } from "../components/branding/logo";

export default function GlobalLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-6">
      <div className="mpa-brand-loading">
        <Logo size="loading" priority />
      </div>
    </main>
  );
}
