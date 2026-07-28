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
      fontSize: {
        "mpa-display": ["var(--mpa-font-size-display)", { lineHeight: "var(--mpa-font-line-height-display)" }],
        "mpa-title": ["var(--mpa-font-size-title)", { lineHeight: "var(--mpa-font-line-height-title)" }],
        "mpa-heading": ["var(--mpa-font-size-heading)", { lineHeight: "var(--mpa-font-line-height-heading)" }],
        "mpa-subheading": [
          "var(--mpa-font-size-subheading)",
          { lineHeight: "var(--mpa-font-line-height-subheading)" }
        ],
        "mpa-body": ["var(--mpa-font-size-body)", { lineHeight: "var(--mpa-font-line-height-body)" }],
        "mpa-caption": ["var(--mpa-font-size-caption)", { lineHeight: "var(--mpa-font-line-height-caption)" }],
        "mpa-micro": ["var(--mpa-font-size-micro)", { lineHeight: "var(--mpa-font-line-height-micro)" }]
      },
      spacing: {
        "mpa-0": "var(--mpa-space-0)",
        "mpa-1": "var(--mpa-space-1)",
        "mpa-2": "var(--mpa-space-2)",
        "mpa-3": "var(--mpa-space-3)",
        "mpa-4": "var(--mpa-space-4)",
        "mpa-5": "var(--mpa-space-5)",
        "mpa-6": "var(--mpa-space-6)",
        "mpa-8": "var(--mpa-space-8)",
        "mpa-10": "var(--mpa-space-10)",
        "mpa-12": "var(--mpa-space-12)",
        "mpa-16": "var(--mpa-space-16)",
        "mpa-20": "var(--mpa-space-20)",
        "mpa-24": "var(--mpa-space-24)"
      },
      colors: {
        canopy: "var(--mpa-color-brand-primary)",
        app: "var(--mpa-color-bg-app)",
        surface: "var(--mpa-color-bg-surface)",
        ink: "var(--mpa-color-bg-sidebar)",
        "mpa-text": "var(--mpa-color-text-primary)",
        "mpa-muted": "var(--mpa-color-text-muted)",
        "mpa-border": "var(--mpa-color-border-default)"
      },
      borderRadius: {
        "mpa-sm": "var(--mpa-radius-sm)",
        "mpa-md": "var(--mpa-radius-md)",
        "mpa-lg": "var(--mpa-radius-lg)",
        "mpa-xl": "var(--mpa-radius-xl)"
      }
    }
  },
  darkMode: "class"
};

export default config;
