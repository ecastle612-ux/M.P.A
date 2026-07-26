import { canopyTokens } from "./canopy";

export type ThemeMode = "light" | "dark";

/** Shared non-color foundation CSS variables (spacing, type, radius, motion, z). */
function foundationVariables(): Record<string, string> {
  const t = canopyTokens;
  return {
    "--mpa-font-size-display": t.font.size.display,
    "--mpa-font-size-title": t.font.size.title,
    "--mpa-font-size-heading": t.font.size.heading,
    "--mpa-font-size-subheading": t.font.size.subheading,
    "--mpa-font-size-body": t.font.size.body,
    "--mpa-font-size-body-lg": t.font.size.bodyLg,
    "--mpa-font-size-caption": t.font.size.caption,
    "--mpa-font-size-micro": t.font.size.micro,
    "--mpa-font-size-mono": t.font.size.mono,
    "--mpa-font-line-height-display": t.font.lineHeight.display,
    "--mpa-font-line-height-title": t.font.lineHeight.title,
    "--mpa-font-line-height-heading": t.font.lineHeight.heading,
    "--mpa-font-line-height-subheading": t.font.lineHeight.subheading,
    "--mpa-font-line-height-body": t.font.lineHeight.body,
    "--mpa-font-line-height-caption": t.font.lineHeight.caption,
    "--mpa-font-line-height-micro": t.font.lineHeight.micro,
    "--mpa-font-weight-regular": t.font.weight.regular,
    "--mpa-font-weight-medium": t.font.weight.medium,
    "--mpa-font-weight-semibold": t.font.weight.semibold,
    "--mpa-font-weight-bold": t.font.weight.bold,
    "--mpa-font-tracking-tight": t.font.tracking.tight,
    "--mpa-font-tracking-normal": t.font.tracking.normal,
    "--mpa-font-tracking-wide": t.font.tracking.wide,
    "--mpa-space-0": t.space[0],
    "--mpa-space-1": t.space[1],
    "--mpa-space-2": t.space[2],
    "--mpa-space-3": t.space[3],
    "--mpa-space-4": t.space[4],
    "--mpa-space-5": t.space[5],
    "--mpa-space-6": t.space[6],
    "--mpa-space-8": t.space[8],
    "--mpa-space-10": t.space[10],
    "--mpa-space-12": t.space[12],
    "--mpa-space-16": t.space[16],
    "--mpa-space-20": t.space[20],
    "--mpa-space-24": t.space[24],
    "--mpa-radius-none": t.radius.none,
    "--mpa-radius-sm": t.radius.sm,
    "--mpa-radius-md": t.radius.md,
    "--mpa-radius-lg": t.radius.lg,
    "--mpa-radius-xl": t.radius.xl,
    "--mpa-radius-full": t.radius.full,
    "--mpa-duration-instant": t.motion.duration.instant,
    "--mpa-duration-fast": t.motion.duration.fast,
    "--mpa-duration-normal": t.motion.duration.normal,
    "--mpa-duration-moderate": t.motion.duration.moderate,
    "--mpa-duration-slow": t.motion.duration.slow,
    "--mpa-motion-fast": t.motion.duration.fast,
    "--mpa-motion-normal": t.motion.duration.normal,
    "--mpa-motion-moderate": t.motion.duration.moderate,
    "--mpa-easing-standard": t.motion.easing.standard,
    "--mpa-ease-standard": t.motion.easing.standard,
    "--mpa-easing-exit": t.motion.easing.exit,
    "--mpa-icon-size-sm": t.icon.size.sm,
    "--mpa-icon-size-md": t.icon.size.md,
    "--mpa-icon-size-lg": t.icon.size.lg,
    "--mpa-icon-size-xl": t.icon.size.xl,
    "--mpa-z-base": t.z.base,
    "--mpa-z-sticky": t.z.sticky,
    "--mpa-z-dropdown": t.z.dropdown,
    "--mpa-z-drawer": t.z.drawer,
    "--mpa-z-modal": t.z.modal,
    "--mpa-z-toast": t.z.toast,
    "--mpa-z-command": t.z.command,
    "--mpa-z-tooltip": t.z.tooltip,
    "--mpa-content-padding-x": t.space[3],
    "--mpa-content-padding-y": t.space[3],
    "--mpa-content-padding-x-md": t.space[4],
    "--mpa-content-padding-y-md": t.space[4],
    "--mpa-content-padding-x-lg": t.space[5],
    "--mpa-content-padding-y-lg": t.space[5]
  };
}

function lightColorVariables(): Record<string, string> {
  const c = canopyTokens.color;
  const s = canopyTokens.shadow;
  return {
    "--mpa-font-display": canopyTokens.font.cssDisplay,
    "--mpa-font-sans": canopyTokens.font.cssSans,
    "--mpa-font-mono": canopyTokens.font.cssMono,
    "--mpa-color-bg-app": c.bg.app,
    "--mpa-color-bg-sidebar": c.bg.sidebar,
    "--mpa-color-bg-sidebar-elevated": c.bg.sidebarElevated,
    "--mpa-color-bg-surface": c.bg.surface,
    "--mpa-color-bg-surface-elevated": c.bg.surfaceElevated,
    "--mpa-color-bg-surface-muted": c.bg.surfaceMuted,
    "--mpa-color-bg-surface-sunken": c.bg.sunken,
    "--mpa-color-bg-overlay": c.bg.overlay,
    "--mpa-color-border-default": c.border.default,
    "--mpa-color-border-subtle": c.border.subtle,
    "--mpa-color-border-strong": c.border.strong,
    "--mpa-color-border-focus": c.border.focus,
    "--mpa-color-border-sidebar": c.border.sidebar,
    "--mpa-color-text-primary": c.text.primary,
    "--mpa-color-text-secondary": c.text.secondary,
    "--mpa-color-text-muted": c.text.muted,
    "--mpa-color-text-tertiary": c.text.muted,
    "--mpa-color-text-inverse": c.text.inverse,
    "--mpa-color-text-sidebar": c.text.sidebar,
    "--mpa-color-text-sidebar-active": c.text.sidebarActive,
    "--mpa-color-text-link": c.text.link,
    "--mpa-color-brand-primary": c.brand.primary,
    "--mpa-color-brand-primary-hover": c.brand.primaryHover,
    "--mpa-color-brand-primary-active": c.brand.primaryActive,
    "--mpa-color-brand-primary-subtle": c.brand.primarySubtle,
    "--mpa-color-brand-secondary": c.brand.secondary,
    "--mpa-color-brand": c.brand.primary,
    "--mpa-color-action-primary": c.brand.primary,
    "--mpa-color-surface-muted": c.bg.surfaceMuted,
    "--mpa-color-border": c.border.default,
    "--mpa-color-status-success": c.status.success,
    "--mpa-color-status-success-subtle": c.status.successSubtle,
    "--mpa-color-status-warning": c.status.warning,
    "--mpa-color-status-warning-subtle": c.status.warningSubtle,
    "--mpa-color-status-danger": c.status.danger,
    "--mpa-color-status-danger-subtle": c.status.dangerSubtle,
    "--mpa-color-status-info": c.status.info,
    "--mpa-color-status-info-subtle": c.status.infoSubtle,
    "--mpa-color-feedback-error": c.text.danger,
    "--mpa-color-interactive-row-hover": c.interactive.rowHover,
    "--mpa-color-interactive-selected": c.interactive.selected,
    "--mpa-color-interactive-focus-ring": c.interactive.focusRing,
    "--mpa-color-interactive-disabled-bg": c.interactive.disabledBg,
    "--mpa-color-interactive-disabled-text": c.interactive.disabledText,
    "--mpa-color-sidebar-accent": c.sidebar.accent,
    "--mpa-shadow-xs": s.xs,
    "--mpa-shadow-sm": s.sm,
    "--mpa-shadow-md": s.md,
    "--mpa-shadow-lg": s.lg,
    "--mpa-shadow-focus": s.focus
  };
}

function darkColorOverrides(): Record<string, string> {
  const d = canopyTokens.color.dark;
  return {
    "--mpa-color-bg-app": d.bg.app,
    "--mpa-color-bg-surface": d.bg.surface,
    "--mpa-color-bg-surface-elevated": d.bg.surfaceElevated,
    "--mpa-color-bg-surface-muted": d.bg.surfaceMuted,
    "--mpa-color-bg-surface-sunken": d.bg.sunken,
    "--mpa-color-bg-overlay": d.bg.overlay,
    "--mpa-color-border-default": d.border.default,
    "--mpa-color-border-subtle": d.border.subtle,
    "--mpa-color-border-strong": d.border.strong,
    "--mpa-color-text-primary": d.text.primary,
    "--mpa-color-text-secondary": d.text.secondary,
    "--mpa-color-text-muted": d.text.muted,
    "--mpa-color-text-tertiary": d.text.muted,
    "--mpa-color-brand-primary": d.brand.primary,
    "--mpa-color-brand-primary-hover": d.brand.primaryHover,
    "--mpa-color-brand-primary-active": d.brand.primaryActive,
    "--mpa-color-brand-primary-subtle": d.brand.primarySubtle,
    "--mpa-color-brand": d.brand.primary,
    "--mpa-color-action-primary": d.brand.primary,
    "--mpa-color-surface-muted": d.bg.surfaceMuted,
    "--mpa-color-border": d.border.default,
    "--mpa-color-interactive-row-hover": d.interactive.rowHover,
    "--mpa-color-interactive-selected": d.interactive.selected,
    "--mpa-color-interactive-disabled-bg": d.interactive.disabledBg,
    "--mpa-color-interactive-disabled-text": d.interactive.disabledText,
    "--mpa-color-status-success-subtle": d.status.successSubtle,
    "--mpa-color-status-warning-subtle": d.status.warningSubtle,
    "--mpa-color-status-danger-subtle": d.status.dangerSubtle,
    "--mpa-color-status-info-subtle": d.status.infoSubtle,
    "--mpa-shadow-xs": d.shadow.xs,
    "--mpa-shadow-sm": d.shadow.sm,
    "--mpa-shadow-md": d.shadow.md,
    "--mpa-shadow-lg": d.shadow.lg
  };
}

/** Theme CSS variables for ThemeProvider (light or dark). */
export function themeCssVariables(mode: ThemeMode): Record<string, string> {
  const light = {
    ...foundationVariables(),
    ...lightColorVariables()
  };
  if (mode === "light") return light;
  return {
    ...light,
    ...darkColorOverrides()
  };
}

export const lightThemeCssVariables = themeCssVariables("light");
export const darkThemeCssVariables = themeCssVariables("dark");
