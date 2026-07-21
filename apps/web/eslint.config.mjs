import base from "../../packages/config/eslint.base.mjs";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@mpa/*/*"],
              message: "Import package public APIs only (e.g. @mpa/ui)."
            },
            {
              group: ["**/packages/*"],
              message: "Do not import package internals via relative paths."
            },
            {
              group: ["**/branding/logo-light.png", "**/branding/logo-dark.png", "**/mpa-logo*"],
              message:
                "BR-001: use <BrandLogo purpose=\"…\" /> — do not import logo assets outside the branding system."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "src/components/branding/**",
      "src/lib/branding.ts",
      "src/lib/integrations/email/render.ts",
      "src/app/layout.tsx",
      "src/app/global-error.tsx"
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/logo-(light|dark)\\.png/]",
          message: "BR-001: use <BrandLogo purpose=\"…\" /> — do not hardcode logo asset paths."
        },
        {
          selector: "TemplateElement[value.raw=/logo-(light|dark)\\.png/]",
          message: "BR-001: use <BrandLogo purpose=\"…\" /> — do not hardcode logo asset paths."
        }
      ]
    }
  }
];

export default config;
