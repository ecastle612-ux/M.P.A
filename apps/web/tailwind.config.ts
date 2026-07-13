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
      }
    }
  },
  darkMode: "class"
};

export default config;
