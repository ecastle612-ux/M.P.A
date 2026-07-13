import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "session-refresh edge function scaffolded"
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    },
  );
});
