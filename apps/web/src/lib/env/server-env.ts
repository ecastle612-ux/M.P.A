import { serverEnvSchema } from "@mpa/shared";

export const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env["NEXT_PUBLIC_APP_NAME"],
  NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
  NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  SESSION_COOKIE_NAME: process.env["SESSION_COOKIE_NAME"],
  SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"]
});
