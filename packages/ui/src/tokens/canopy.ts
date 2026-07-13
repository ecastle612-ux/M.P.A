export const canopyTokens = {
  color: {
    brand: {
      primary: "#0F6B56",
      primaryHover: "#0C5A48",
      primaryActive: "#094839",
      primarySubtle: "#E6F4EF",
      secondary: "#3A4150"
    },
    bg: {
      app: "#F3F4F6",
      sidebar: "#12151A",
      sidebarElevated: "#1A1E25",
      surface: "#FFFFFF",
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
    }
  },
  font: {
    display: "Satoshi, \"IBM Plex Sans\", system-ui, sans-serif",
    sans: "\"IBM Plex Sans\", \"Segoe UI\", system-ui, sans-serif",
    mono: "\"IBM Plex Mono\", ui-monospace, monospace"
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
    16: "64px"
  },
  motion: {
    duration: {
      fast: "120ms",
      normal: "200ms",
      moderate: "280ms",
      slow: "400ms"
    },
    easing: {
      standard: "cubic-bezier(0.2, 0.0, 0, 1)",
      exit: "cubic-bezier(0.4, 0.0, 1, 1)"
    }
  }
} as const;

export type CanopyTokens = typeof canopyTokens;
