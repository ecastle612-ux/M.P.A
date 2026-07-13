import { clientEnvSchema } from "@mpa/shared";

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env["NEXT_PUBLIC_APP_NAME"],
  NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
  NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
});
