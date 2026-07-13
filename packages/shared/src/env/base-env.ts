import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

export const serverEnvSchema = clientEnvSchema.extend({
  SESSION_COOKIE_NAME: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional()
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
