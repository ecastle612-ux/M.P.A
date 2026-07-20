const RECOVERY_QUERY_KEYS = [
  "code",
  "token_hash",
  "type",
  "access_token",
  "refresh_token",
  "error",
  "error_code",
  "error_description"
] as const;

type RecoveryFlow = "code" | "session_tokens" | "token_hash" | "none";

export type RecoveryParams = {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

export function parseRecoveryParams(search: string, hash: string): RecoveryParams {
  const queryParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  return {
    code: queryParams.get("code") ?? hashParams.get("code"),
    tokenHash: queryParams.get("token_hash") ?? hashParams.get("token_hash"),
    type: queryParams.get("type") ?? hashParams.get("type"),
    accessToken: queryParams.get("access_token") ?? hashParams.get("access_token"),
    refreshToken: queryParams.get("refresh_token") ?? hashParams.get("refresh_token"),
    error: queryParams.get("error") ?? hashParams.get("error"),
    errorCode: queryParams.get("error_code") ?? hashParams.get("error_code"),
    errorDescription: queryParams.get("error_description") ?? hashParams.get("error_description")
  };
}

export function detectRecoveryFlow(params: RecoveryParams): RecoveryFlow {
  if (params.code) return "code";
  if (params.accessToken && params.refreshToken) return "session_tokens";
  if (params.tokenHash) return "token_hash";
  return "none";
}

export function stripRecoveryParamsFromUrl(currentUrl: URL): string {
  const nextUrl = new URL(currentUrl.toString());
  for (const key of RECOVERY_QUERY_KEYS) {
    nextUrl.searchParams.delete(key);
  }
  nextUrl.hash = "";
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}
