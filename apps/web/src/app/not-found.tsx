import Link from "next/link";
import { buttonClassName, Card } from "@mpa/ui";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          The route you requested does not exist in the current portal foundation.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/portal" className={buttonClassName({ variant: "primary", size: "sm" })}>
            Portal home
          </Link>
          <Link href="/login" className={buttonClassName({ variant: "secondary", size: "sm" })}>
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}
