import { Logo } from "../branding/logo";
import { MPA_BRAND_NAME, MPA_BRAND_TAGLINE, MPA_LOGO_WIDTH } from "../../lib/branding";

const SIDEBAR_LOGO_HEIGHT_PX = MPA_LOGO_WIDTH.sidebarMark;

export function SidebarBrandHeader({ collapsed }: { collapsed: boolean }) {
  const logo = (
    <Logo
      width={SIDEBAR_LOGO_HEIGHT_PX}
      priority
      aria-hidden
      className="h-[34px] w-[34px] shrink-0 object-contain [object-view-box:inset(0_0_68%_0)]"
    />
  );

  if (collapsed) {
    return logo;
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo}
      <div className="flex min-w-0 flex-col justify-center leading-none">
        <p className="truncate text-[18px] font-bold leading-tight text-[var(--mpa-color-text-sidebar-active)]">
          {MPA_BRAND_NAME}
        </p>
        <p className="mt-1 truncate text-[11px] leading-snug text-[var(--mpa-color-text-sidebar)]/70">
          {MPA_BRAND_TAGLINE}
        </p>
      </div>
    </div>
  );
}
