import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagBadgeProps {
  name: string;
  color?: string;
  onRemove?: () => void;
  clickable?: boolean;
  onClick?: () => void;
}

export function TagBadge({ name, color = "#3b82f6", onRemove, clickable, onClick }: TagBadgeProps) {
  return (
    <Badge
      variant="secondary"
      style={{ backgroundColor: `${color}20`, color: color }}
      className={`pl-2 ${onRemove ? "pr-1" : "pr-2"} ${clickable ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-background/20 rounded-sm p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
