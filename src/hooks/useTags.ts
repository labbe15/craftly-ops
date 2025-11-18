import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
  usage_count?: number;
}

export function useTags(category?: string) {
  const queryClient = useQueryClient();

  // Fetch tags
  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags", category],
    queryFn: async () => {
      let query = supabase
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as Tag[];
    },
  });

  // Create tag
  const createTag = useMutation({
    mutationFn: async ({ name, color, category: cat }: { name: string; color?: string; category?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tags")
        .insert({
          name,
          color: color || getRandomColor(),
          category: cat || category || null,
          org_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag créé");
    },
  });

  // Update tag
  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag mis à jour");
    },
  });

  // Delete tag
  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag supprimé");
    },
  });

  // Increment usage
  const incrementUsage = async (tagId: string) => {
    const tag = tags?.find((t) => t.id === tagId);
    if (tag) {
      await supabase
        .from("tags")
        .update({ usage_count: (tag.usage_count || 0) + 1 })
        .eq("id", tagId);
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  };

  return {
    tags: tags || [],
    isLoading,
    createTag: createTag.mutate,
    createTagAsync: createTag.mutateAsync,
    updateTag: updateTag.mutate,
    deleteTag: deleteTag.mutate,
    incrementUsage,
  };
}

function getRandomColor() {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // yellow
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
