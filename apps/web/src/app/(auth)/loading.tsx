import { Logo } from "../../components/branding/logo";

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-6">
      <div className="space-y-3 text-center">
        <div className="mpa-brand-loading mx-auto">
          <Logo size="loading" priority />
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Preparing a secure sign-in…</p>
      </div>
    </main>
  );
}
