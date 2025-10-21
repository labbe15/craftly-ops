import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrgId() {
  const { data: orgId, isLoading, error } = useQuery({
    queryKey: ["orgId"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_organizations")
        .select("org_id")
        .single();

      if (error) throw error;
      return data.org_id as string;
    },
    staleTime: Infinity, // The org_id won't change during the session
  });

  return { orgId, isLoading, error };
}
