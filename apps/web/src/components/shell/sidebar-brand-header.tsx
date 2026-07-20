import { Logo } from "../branding/logo";

export function SidebarBrandHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={collapsed ? "flex items-center justify-center" : "flex min-w-0 items-center"}>
      <Logo
        size={collapsed ? "sidebarCollapsed" : "sidebarExpanded"}
        priority
        className="transition-[width] duration-[var(--mpa-duration-fast)]"
      />
    </div>
  );
}
