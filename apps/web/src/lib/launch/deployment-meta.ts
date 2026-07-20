export type MpaDeploymentEnv = "development" | "staging" | "production" | "preview";

export type DeploymentMeta = {
  env: MpaDeploymentEnv;
  version: string;
  build: string;
  designPartnerMode: boolean;
  feedbackUrl: string | null;
  canonicalUrl: string;
  envLabel: string;
};

function normalizeEnv(raw: string | undefined): MpaDeploymentEnv {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "production" || value === "prod") return "production";
  if (value === "staging" || value === "stage") return "staging";
  if (value === "preview") return "preview";
  if (value === "development" || value === "dev" || value === "local") return "development";

  const vercelEnv = (process.env["VERCEL_ENV"] ?? "").trim().toLowerCase();
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";

  if (process.env["NODE_ENV"] === "production") return "production";
  return "development";
}

function resolveDesignPartnerMode(env: MpaDeploymentEnv): boolean {
  const raw = (process.env["NEXT_PUBLIC_DESIGN_PARTNER_MODE"] ?? "").trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  // Default: Private Beta chrome in production/staging until GA.
  return env === "production" || env === "staging";
}

function envLabel(env: MpaDeploymentEnv, designPartnerMode: boolean): string {
  if (designPartnerMode && (env === "production" || env === "staging")) {
    return "Private Beta";
  }
  if (env === "production") return "Production";
  if (env === "staging") return "Staging";
  if (env === "preview") return "Preview";
  return "Development";
}

export function getDeploymentMeta(): DeploymentMeta {
  const env = normalizeEnv(process.env["NEXT_PUBLIC_MPA_ENV"]);
  const designPartnerMode = resolveDesignPartnerMode(env);
  const version =
    process.env["NEXT_PUBLIC_MPA_VERSION"]?.trim() ||
    process.env["npm_package_version"]?.trim() ||
    "1.0.0";
  const build =
    process.env["NEXT_PUBLIC_MPA_BUILD"]?.trim() ||
    process.env["VERCEL_GIT_COMMIT_SHA"]?.trim()?.slice(0, 7) ||
    process.env["VERCEL_DEPLOYMENT_ID"]?.trim()?.slice(0, 8) ||
    "local";
  const feedbackRaw = process.env["NEXT_PUBLIC_FEEDBACK_URL"]?.trim() || "";
  const canonicalUrl =
    process.env["NEXT_PUBLIC_APP_URL"]?.replace(/\/$/, "") || "http://localhost:3000";

  return {
    env,
    version,
    build,
    designPartnerMode,
    feedbackUrl: feedbackRaw || null,
    canonicalUrl,
    envLabel: envLabel(env, designPartnerMode)
  };
}
