import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  category?: string;
  placeholder?: string;
}

export function TagInput({ value = [], onChange, category, placeholder = "Ajouter des tags..." }: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Fetch existing tags
  const { data: tags } = useQuery({
    queryKey: ["tags", category],
    queryFn: async () => {
      let query = supabase
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Tag[];
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      // Get org_id from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tags")
        .insert({
          name,
          org_id: user.id, // In production, get from org_settings
          category: category || null,
          color: getRandomColor(),
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
    onError: () => {
      toast.error("Erreur lors de la création du tag");
    },
  });

  // Get random color for new tags
  const getRandomColor = () => {
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
  };

  // Get tag color
  const getTagColor = (tagName: string) => {
    const tag = tags?.find((t) => t.name === tagName);
    return tag?.color || "#3b82f6";
  };

  // Add tag
  const addTag = (tagName: string) => {
    if (!value.includes(tagName)) {
      onChange([...value, tagName]);

      // Increment usage count
      const tag = tags?.find((t) => t.name === tagName);
      if (tag) {
        supabase
          .from("tags")
          .update({ usage_count: (tag.usage_count || 0) + 1 })
          .eq("id", tag.id)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["tags"] });
          });
      }
    }
    setSearch("");
  };

  // Remove tag
  const removeTag = (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
  };

  // Create new tag
  const handleCreateTag = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    // Check if tag already exists
    const exists = tags?.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      addTag(trimmed);
      return;
    }

    // Create new tag
    try {
      const newTag = await createTagMutation.mutateAsync(trimmed);
      addTag(newTag.name);
      setOpen(false);
    } catch (error) {
      // Handle error
    }
  };

  // Filter tags based on search
  const filteredTags = tags?.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tagName) => (
            <Badge
              key={tagName}
              variant="secondary"
              style={{ backgroundColor: `${getTagColor(tagName)}20`, color: getTagColor(tagName) }}
              className="pl-2 pr-1"
            >
              {tagName}
              <button
                onClick={() => removeTag(tagName)}
                className="ml-1 hover:bg-background/20 rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground">
            <TagIcon className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher ou créer un tag..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <div className="p-2">
                <Button
                  onClick={handleCreateTag}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  disabled={!search.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer "{search}"
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredTags?.map((tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => {
                    addTag(tag.name);
                    setOpen(false);
                  }}
                >
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    className="mr-2"
                  >
                    {tag.name}
                  </Badge>
                  {tag.usage_count && tag.usage_count > 0 && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {tag.usage_count}x
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
