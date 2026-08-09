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
  /**
   * `hero` — large lockup for the landing hero header.
   * `nav` — slightly smaller for sticky/dense marketing pages.
   */
  size?: "hero" | "nav";
  className?: string;
};

const sizeClassName = {
  hero: "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28",
  nav: "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
} as const;

/**
 * Public-site brand lockup using the approved M.P.A. logo assets.
 * Sized so icon + wordmark stay readable in the header.
 */
export function SiteLogo({ surface, size = "hero", className }: SiteLogoProps) {
  const alt = `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`;
  const png = logoPathForSurface(surface);
  const webp = logoWebpPathForSurface(surface);

  return (
    <Link
      href="/"
      className={
        className ??
        `relative inline-flex shrink-0 items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2 ${sizeClassName[size]}`
      }
      aria-label={alt}
    >
      {/* Source PNGs include transparent canvas padding — scale so the lockup fills the slot. */}
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
