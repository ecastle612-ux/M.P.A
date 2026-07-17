import { createAuthServerComponentClient } from "../auth/server";

export async function getUserDisplayNameForGreeting(userId: string, email: string | null): Promise<string | null> {
  const supabase = await createAuthServerComponentClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const displayName = data?.display_name?.trim() || null;
  if (displayName) return displayName;

  const localPart = email?.split("@")[0]?.trim();
  return localPart || null;
}
