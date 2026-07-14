import { MpaLogo } from "../components/branding/mpa-logo";

export default function GlobalLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-4">
      <div className="flex flex-col items-center gap-3">
        <MpaLogo priority className="h-20 w-auto sm:h-24" alt="M.P.A. logo" />
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading workspace...</p>
      </div>
    </main>
  );
}
