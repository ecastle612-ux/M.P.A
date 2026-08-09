import Link from "next/link";
import {
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  logoPathForSurface,
  logoWebpPathForSurface
} from "../../lib/branding";

type SiteLogoProps = {
  /** Surrounding chrome tone — picks light vs dark approved lockup. */
  surface: "light" | "dark";
  className?: string;
};

/**
 * Public-site brand lockup using the approved M.P.A. logo assets.
 * Source PNGs include transparent canvas padding; we scale the asset so the
 * lockup fills the header slot without enlarging overall header height.
 */
export function SiteLogo({ surface, className }: SiteLogoProps) {
  const alt = `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`;
  const png = logoPathForSurface(surface);
  const webp = logoWebpPathForSurface(surface);

  return (
    <Link
      href="/"
      className={
        className ??
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2 md:h-11 md:w-11"
      }
      aria-label={alt}
    >
      <picture className="pointer-events-none absolute left-1/2 top-1/2 block h-[210%] w-[210%] -translate-x-1/2 -translate-y-1/2">
        <source srcSet={webp} type="image/webp" />
        <img
          src={png}
          alt={alt}
          width={512}
          height={512}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-contain"
        />
      </picture>
    </Link>
  );
}
