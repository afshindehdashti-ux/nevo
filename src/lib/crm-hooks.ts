import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";

export type AppRole = Database["public"]["Enums"]["app_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const ACCESS_QUERY_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ACCESS_QUERY_TIMEOUT_MS / 1000}s`));
    }, ACCESS_QUERY_TIMEOUT_MS);

    Promise.resolve(promise).then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function useCurrentUser() {
  return useQuery<User | null, Error>({
    queryKey: ["crm", "current-user"],
    queryFn: async () => {
      const { data, error } = await withTimeout(supabase.auth.getUser(), "User session check");
      if (error) throw error;
      return data.user ?? null;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useMyRoles() {
  const { data: user } = useCurrentUser();
  return useQuery<AppRole[], Error>({
    queryKey: ["crm", "my-roles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        "Role lookup",
      );
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useIsSuperAdmin() {
  const { data: roles } = useMyRoles();
  return (roles ?? []).includes("super_admin");
}

export function useMyProfile() {
  const { data: user } = useCurrentUser();
  return useQuery<Profile | null, Error>({
    queryKey: ["crm", "my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        "Profile lookup",
      );
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    retry: false,
  });
}
