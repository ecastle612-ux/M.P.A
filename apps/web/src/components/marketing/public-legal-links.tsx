import Link from "next/link";
import { PUBLIC_LEGAL_PATHS } from "../../lib/legal/public-legal-copy";

export function PublicLegalLinks({
  className = "flex flex-wrap gap-4",
  linkClassName = "hover:text-[var(--mpa-color-text-primary)]"
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <nav aria-label="Legal" className={className}>
      <Link href={PUBLIC_LEGAL_PATHS.privacy} className={linkClassName}>
        Privacy Policy
      </Link>
      <Link href={PUBLIC_LEGAL_PATHS.terms} className={linkClassName}>
        Terms
      </Link>
    </nav>
  );
}
