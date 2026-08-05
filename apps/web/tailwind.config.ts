import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--mpa-font-display)"],
        sans: ["var(--mpa-font-sans)"],
        mono: ["var(--mpa-font-mono)"]
      },
      colors: {
        canopy: "var(--mpa-color-brand-primary)",
        app: "var(--mpa-color-bg-app)",
        surface: "var(--mpa-color-bg-surface)",
        ink: "var(--mpa-color-bg-sidebar)"
      },
      borderRadius: {
        "mpa-sm": "var(--mpa-radius-sm)",
        "mpa-md": "var(--mpa-radius-md)",
        "mpa-lg": "var(--mpa-radius-lg)",
        "mpa-xl": "var(--mpa-radius-xl)"
      },
      boxShadow: {
        "mpa-sm": "var(--mpa-elevation-sm)",
        "mpa-md": "var(--mpa-elevation-md)",
        "mpa-lg": "var(--mpa-elevation-lg)"
      },
      transitionDuration: {
        "mpa-fast": "var(--mpa-motion-fast)",
        "mpa-normal": "var(--mpa-motion-normal)",
        "mpa-moderate": "var(--mpa-motion-moderate)"
      },
      transitionTimingFunction: {
        mpa: "var(--mpa-ease-standard)",
        "mpa-exit": "var(--mpa-ease-exit)"
      },
      keyframes: {
        "mpa-fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "mpa-fade-in": "mpa-fade-in var(--mpa-motion-normal) var(--mpa-ease-standard) both"
      }
    }
  },
  darkMode: "class"
};

export default config;
