import { createClient } from "@/lib/supabase/server";
import { Profile, Role } from "@/types/domain";

export async function requireUser(roles?: Role[]) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (roles && !roles.includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }

  return {
    supabase,
    user,
    profile,
  };
}