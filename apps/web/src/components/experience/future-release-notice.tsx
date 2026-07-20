import Link from "next/link";
import { Button, Card } from "@mpa/ui";

export function FutureReleaseNotice({
  title,
  description = "This feature will become available during a future release.",
  primaryHref = "/dashboard",
  primaryLabel = "Return to Operations Center"
}: {
  title: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
          Future release
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      </div>
      <Link href={primaryHref}>
        <Button type="button">{primaryLabel}</Button>
      </Link>
    </Card>
  );
}
