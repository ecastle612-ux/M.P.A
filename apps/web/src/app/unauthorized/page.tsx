import Link from "next/link";
import { Card } from "@mpa/ui";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Unauthorized
        </h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Your current role or organization context does not allow access to this route.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/portal"
            className="rounded-md bg-[var(--mpa-color-action-primary)] px-3 py-2 text-sm text-white"
          >
            Go to portal
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm"
          >
            Go to dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
