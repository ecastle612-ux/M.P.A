import { corsHeaders } from "../_shared/cors.ts";

/**
 * Foundation placeholder only.
 * Real auth flows continue to use Supabase Auth directly from web app.
 */
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "auth-login edge function scaffolded"
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    },
  );
});
