import dynamic from "next/dynamic";
import { Input } from "@mpa/ui";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";

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
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]"
      >
        Command
      </button>
    )
  },
);

export function TopNavigation() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]/95 backdrop-blur"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 md:px-6 lg:px-8">
        <div className="hidden min-w-[280px] flex-1 lg:block">
          <Input aria-label="Search properties and units" placeholder="Search properties and units..." />
        </div>
        <nav className="ml-auto flex items-center gap-2 md:gap-3" aria-label="Global controls">
          <div className="hidden xl:block">
            <OrganizationSwitcher />
          </div>
          <div className="hidden xl:block">
            <RoleSwitcher />
          </div>
          <div className="hidden md:block">
            <CommandPalette />
          </div>
          <NotificationCenter />
          <ProfileMenu />
        </nav>
      </div>
    </header>
  );
}
