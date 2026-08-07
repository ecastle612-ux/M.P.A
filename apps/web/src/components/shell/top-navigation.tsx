import dynamic from "next/dynamic";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";
import { PlanBadge } from "./plan-badge";
import { GlobalSearch } from "./global-search";

const CommandPalette = dynamic(
  async () => {
    const importedModule = await import("./command-palette");
    return importedModule.CommandPalette;
  },
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]"
      >
        Quick Actions
      </button>
    )
  }
);

export function TopNavigation() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4">
      <GlobalSearch />
      <PlanBadge />
      <OrganizationSwitcher />
      <RoleSwitcher />
      <CommandPalette />
      <NotificationCenter />
      <ProfileMenu />
    </header>
  );
}
