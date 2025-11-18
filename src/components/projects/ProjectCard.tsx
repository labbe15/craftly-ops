import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Euro, User, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";

type ProjectStatus = "lead" | "quoted" | "won" | "in_progress" | "completed" | "cancelled" | "on_hold";

interface Project {
  id: string;
  number: string;
  name: string;
  status: ProjectStatus;
  priority: string;
  start_date: string | null;
  deadline: string | null;
  budget_quoted: number;
  progress_percentage: number;
  client_id: string | null;
  clients?: {
    name: string;
  };
}

interface ProjectCardProps {
  project: Project;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityLabels = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const isOverdue = project.deadline && isPast(new Date(project.deadline)) && project.status !== "completed";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        onClick={(e) => {
          if (!isDragging) {
            navigate(`/projects/${project.id}`);
          }
        }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm line-clamp-2">{project.name}</h3>
              {isOverdue && (
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{project.number}</p>
          </div>

          {/* Client */}
          {project.clients && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs truncate">
                {project.clients.name}
              </span>
            </div>
          )}

          {/* Budget */}
          <div className="flex items-center gap-2 text-sm">
            <Euro className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-xs">
              {project.budget_quoted?.toFixed(0)} €
            </span>
          </div>

          {/* Deadline */}
          {project.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                {format(new Date(project.deadline), "dd MMM yyyy", { locale: fr })}
              </span>
            </div>
          )}

          {/* Progress */}
          {project.status === "in_progress" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{project.progress_percentage}%</span>
              </div>
              <Progress value={project.progress_percentage} className="h-1.5" />
            </div>
          )}

          {/* Priority */}
          <div>
            <Badge
              variant="secondary"
              className={`${priorityColors[project.priority as keyof typeof priorityColors] || priorityColors.medium} text-xs`}
            >
              {priorityLabels[project.priority as keyof typeof priorityLabels] || project.priority}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
