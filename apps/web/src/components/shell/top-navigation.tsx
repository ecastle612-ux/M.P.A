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
      <div className="h-10 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
        Search…
      </div>
    )
  }
);

export function TopNavigation() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]/95 backdrop-blur"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 md:px-6 lg:px-8">
        <div className="hidden min-w-[280px] flex-1 lg:block">
          <CommandCenter />
        </div>
        <nav className="ml-auto flex items-center gap-2 md:gap-3" aria-label="Global controls">
          <div className="hidden min-w-[280px] flex-1 md:block lg:hidden">
            <CommandCenter />
          </div>
          <div className="hidden xl:block">
            <OrganizationSwitcher />
          </div>
          <div className="hidden xl:block">
            <RoleSwitcher />
          </div>
          <NotificationCenter />
          <ProfileMenu />
        </nav>
      </div>
    </header>
  );
}
