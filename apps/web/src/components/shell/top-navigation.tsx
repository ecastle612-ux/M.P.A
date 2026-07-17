import dynamic from "next/dynamic";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";

const CommandCenter = dynamic(
  async () => {
    const importedModule = await import("./command-center");
    return importedModule.CommandCenter;
  },
  {
    ssr: false,
      loading: () => (
      <div className="flex h-10 w-full items-center rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] px-4 text-sm text-[var(--mpa-color-text-muted)]">
        Search properties, tenants, leases…
      </div>
    )
  }
);

export function TopNavigation() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/92 backdrop-blur-md"
    >
      <div className="flex h-[var(--mpa-topbar-height)] w-full items-center gap-3 px-4 md:gap-4 md:px-5 lg:px-6">
        <div className="hidden min-w-0 flex-1 lg:block">
          <CommandCenter />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3 lg:flex-none lg:shrink-0">
          <div className="min-w-0 flex-1 lg:hidden">
            <CommandCenter />
          </div>
          <OrganizationSwitcher />
          <RoleSwitcher />
          <NotificationCenter />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
