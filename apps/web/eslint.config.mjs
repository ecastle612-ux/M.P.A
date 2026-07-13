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
            }
          ]
        }
      ]
    }
  }
];

export default config;
