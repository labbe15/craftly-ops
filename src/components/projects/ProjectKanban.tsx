import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "./ProjectCard";

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

interface Column {
  id: ProjectStatus;
  title: string;
  color: string;
}

interface ProjectKanbanProps {
  columns: Column[];
  projects: Project[];
}

function DroppableColumn({ column, projects }: { column: Column; projects: Project[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const columnProjects = projects.filter((p) => p.status === column.id);

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px]">
      <Card className={`h-full ${isOver ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className={`${column.color} pb-3`}>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{column.title}</span>
            <span className="bg-white px-2 py-0.5 rounded-full text-xs">
              {columnProjects.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3 min-h-[400px]">
          {columnProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {columnProjects.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Aucun projet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectKanban({ columns, projects }: ProjectKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <DroppableColumn key={column.id} column={column} projects={projects} />
      ))}
    </div>
  );
}
