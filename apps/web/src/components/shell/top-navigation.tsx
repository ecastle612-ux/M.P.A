import dynamic from "next/dynamic";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";
import { PlanBadge } from "./plan-badge";

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
        className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-left text-sm text-[var(--mpa-color-text-secondary)]"
      >
        Search workspace…
      </button>
    )
  }
);

const QuickCreateButton = dynamic(
  async () => {
    const importedModule = await import("./command-palette");
    return importedModule.QuickCreateButton;
  },
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-3 text-sm font-medium text-white"
      >
        + Create
      </button>
    )
  }
);

export function TopNavigation() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 sm:gap-3 sm:px-4">
      <div className="min-w-0 flex-1">
        <CommandPalette />
      </div>
      <QuickCreateButton />
      <PlanBadge />
      <OrganizationSwitcher />
      <RoleSwitcher />
      <NotificationCenter />
      <ProfileMenu />
    </header>
  );
}
