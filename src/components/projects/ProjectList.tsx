import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

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

interface ProjectListProps {
  projects: Project[];
}

const statusLabels: Record<ProjectStatus, string> = {
  lead: "Lead",
  quoted: "Devis envoyé",
  won: "Gagné",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  on_hold: "En pause",
};

const statusColors: Record<ProjectStatus, string> = {
  lead: "bg-gray-100 text-gray-800",
  quoted: "bg-blue-100 text-blue-800",
  won: "bg-green-100 text-green-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  on_hold: "bg-orange-100 text-orange-800",
};

const priorityLabels = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function ProjectList({ projects }: ProjectListProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun projet trouvé
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° / Nom</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Progression</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const isOverdue = project.deadline && isPast(new Date(project.deadline)) && project.status !== "completed";

            return (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{project.number}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {project.clients ? project.clients.name : "-"}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={priorityColors[project.priority as keyof typeof priorityColors] || priorityColors.medium}
                  >
                    {priorityLabels[project.priority as keyof typeof priorityLabels] || project.priority}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {project.budget_quoted?.toFixed(0)} €
                </TableCell>
                <TableCell>
                  {project.deadline ? (
                    <div className="flex items-center gap-2">
                      {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                      <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                        {format(new Date(project.deadline), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {project.status === "in_progress" ? (
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress_percentage} className="w-24 h-2" />
                      <span className="text-sm font-medium">
                        {project.progress_percentage}%
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
