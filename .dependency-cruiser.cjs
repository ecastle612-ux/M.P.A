/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true }
    },
    {
      name: "no-orphans",
      severity: "warn",
      from: {
        orphan: true,
        pathNot:
          "\\.(test|spec)\\.(ts|tsx)$|apps/web/src/app/manifest\\.ts$|packages/email/src/index\\.ts$|apps/web/src/app/(page|layout|loading|error|not-found|template|route)\\.(ts|tsx)$|apps/web/src/app/.*/(page|layout|loading|error|not-found|template|route)\\.(ts|tsx)$"
      },
      to: {}
    },
    {
      name: "apps-must-not-import-package-internals",
      severity: "error",
      from: { path: "^apps/" },
      to: {
        path: "^packages/[^/]+/src/",
        pathNot: "^packages/[^/]+/src/index\\.(ts|tsx)$"
      }
    },
    {
      name: "apps-must-not-import-qa",
      severity: "error",
      from: { path: "^apps/" },
      to: { path: "^qa/" }
    },
    {
      name: "packages-must-not-import-qa",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^qa/" }
    },
    {
      name: "ui-must-not-depend-on-apps",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^apps/" }
    },
    {
      name: "shared-must-not-depend-on-ui",
      severity: "error",
      from: { path: "^packages/shared/" },
      to: { path: "^packages/ui/" }
    },
    {
      name: "supabase-must-not-depend-on-web-app",
      severity: "error",
      from: { path: "^packages/supabase/" },
      to: { path: "^apps/web/" }
    }
  ],
  options: {
    tsConfig: {
      fileName: "tsconfig.base.json"
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"]
    },
    doNotFollow: {
      path: "node_modules"
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+"
      }
    }
  }
};
