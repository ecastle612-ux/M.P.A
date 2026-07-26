/**
 * Canopy design tokens — UX-012 Slice A foundation SoT.
 * Values align with docs/06-design-language/design-token-system.md.
 * Consume via CSS custom properties (`--mpa-*`) or this map — never hardcode HEX/px in feature UI.
 */

export const canopyTokens = {
  color: {
    brand: {
      primary: "#0F6B56",
      primaryHover: "#0C5A48",
      primaryActive: "#094839",
      primarySubtle: "#E6F4EF",
      secondary: "#3A4150",
      accent: "#0F6B56"
    },
    bg: {
      app: "#F3F4F6",
      sidebar: "#12151A",
      sidebarElevated: "#1A1E25",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFFF",
      surfaceMuted: "#EEF0F3",
      sunken: "#E5E7EB",
      overlay: "#12151A99"
    },
    border: {
      subtle: "#E5E7EB",
      default: "#D1D5DB",
      strong: "#9CA3AF",
      focus: "#0F6B56",
      sidebar: "#2A2F38"
    },
    text: {
      primary: "#12151A",
      secondary: "#4B5563",
      muted: "#6B7280",
      inverse: "#F9FAFB",
      sidebar: "#C4C9D1",
      sidebarActive: "#FFFFFF",
      link: "#0F6B56",
      danger: "#B42318"
    },
    status: {
      success: "#0E7A57",
      warning: "#B45309",
      danger: "#C0392B",
      info: "#1D6AA5",
      successSubtle: "#E3F5EE",
      warningSubtle: "#FEF3C7",
      dangerSubtle: "#FCE8E6",
      infoSubtle: "#E5F1FA"
    },
    interactive: {
      default: "#0F6B56",
      hover: "#0C5A48",
      focusRing: "#0F6B5640",
      disabledBg: "#E5E7EB",
      disabledText: "#9CA3AF",
      selected: "#E6F4EF",
      rowHover: "#F7F8FA"
    },
    sidebar: {
      accent: "#1FA87A",
      itemHover: "#1A1E25"
    },
    /** Dark semantic pairs (ThemeProvider / [data-theme=dark]). Brand primary preserves AA on inverse text. */
    dark: {
      bg: {
        app: "#0B0D10",
        surface: "#14181E",
        surfaceElevated: "#171C23",
        surfaceMuted: "#1B2028",
        sunken: "#0F1318",
        overlay: "#00000099"
      },
      border: {
        default: "#2A313C",
        subtle: "#202630",
        strong: "#4B5563"
      },
      text: {
        primary: "#F3F4F6",
        secondary: "#CBD5E1",
        muted: "#94A3B8"
      },
      brand: {
        primary: "#15825F",
        primaryHover: "#1FA87A",
        primaryActive: "#0F6B56",
        primarySubtle: "#12352C"
      },
      interactive: {
        rowHover: "#1B2028",
        selected: "#12352C",
        disabledBg: "#202630",
        disabledText: "#64748B"
      },
      status: {
        successSubtle: "#12352C",
        warningSubtle: "#3A2A10",
        dangerSubtle: "#3A1714",
        infoSubtle: "#142A3A"
      },
      shadow: {
        xs: "0 1px 2px rgb(0 0 0 / 0.28)",
        sm: "0 1px 3px rgb(0 0 0 / 0.3), 0 1px 2px rgb(0 0 0 / 0.24)",
        md: "0 4px 12px rgb(0 0 0 / 0.34), 0 2px 4px rgb(0 0 0 / 0.24)",
        lg: "0 12px 32px rgb(0 0 0 / 0.42), 0 4px 8px rgb(0 0 0 / 0.26)"
      }
    }
  },
  font: {
    /** Legacy flat keys (ThemeProvider / consumers). */
    display: 'var(--font-ibm-plex-sans), "IBM Plex Sans", system-ui, sans-serif',
    sans: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
    /** Next.js font-loader aware stacks for :root CSS. */
    cssDisplay: "var(--font-ibm-plex-sans), system-ui, sans-serif",
    cssSans: 'var(--font-ibm-plex-sans), "Segoe UI", system-ui, sans-serif',
    cssMono: "var(--font-ibm-plex-mono), ui-monospace, monospace",
    size: {
      display: "2rem",
      title: "1.5rem",
      heading: "1.125rem",
      subheading: "1rem",
      body: "0.875rem",
      bodyLg: "0.9375rem",
      caption: "0.75rem",
      micro: "0.6875rem",
      mono: "0.8125rem"
    },
    lineHeight: {
      display: "1.2",
      title: "1.25",
      heading: "1.3",
      subheading: "1.35",
      body: "1.5",
      caption: "1.4",
      micro: "1.35"
    },
    weight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    },
    tracking: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.04em"
    }
  },
  radius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px"
  },
  space: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    20: "80px",
    24: "96px"
  },
  /** PMX-004 Phase 5 — WCAG / native minimum interactive target */
  touch: {
    min: "44px"
  },
  shadow: {
    xs: "0 1px 2px rgb(18 21 26 / 0.04)",
    sm: "0 1px 3px rgb(18 21 26 / 0.06), 0 1px 2px rgb(18 21 26 / 0.04)",
    md: "0 4px 12px rgb(18 21 26 / 0.08), 0 2px 4px rgb(18 21 26 / 0.04)",
    lg: "0 12px 32px rgb(18 21 26 / 0.1), 0 4px 8px rgb(18 21 26 / 0.04)",
    focus: "0 0 0 3px var(--mpa-color-interactive-focus-ring)"
  },
  motion: {
    duration: {
      instant: "0ms",
      fast: "120ms",
      normal: "200ms",
      moderate: "280ms",
      slow: "400ms"
    },
    easing: {
      standard: "cubic-bezier(0.2, 0.0, 0, 1)",
      exit: "cubic-bezier(0.4, 0.0, 1, 1)",
      linear: "linear"
    }
  },
  icon: {
    size: {
      sm: "14px",
      md: "16px",
      lg: "20px",
      xl: "24px"
    },
    stroke: "1.75px"
  },
  z: {
    base: "0",
    sticky: "10",
    dropdown: "20",
    drawer: "30",
    modal: "40",
    toast: "50",
    overlaySystem: "60",
    sidebar: "30",
    command: "80",
    tooltip: "90"
  }
} as const;

export type CanopyTokens = typeof canopyTokens;
