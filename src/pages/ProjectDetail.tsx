import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Edit, Trash2, ArrowLeft, MapPin, Calendar, Euro, Clock, Flag, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { TagBadge } from "@/components/tags/TagBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Project {
  id: string;
  number: string;
  name: string;
  description?: string;
  client_id?: string;
  type?: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  budget_quoted?: number;
  budget_actual?: number;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name?: string;
  company_name?: string;
}

const statusLabels: Record<string, string> = {
  lead: "Lead",
  quoted: "Devis envoyé",
  won: "Gagné",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  on_hold: "En pause",
};

const statusColors: Record<string, string> = {
  lead: "bg-slate-500",
  quoted: "bg-blue-500",
  won: "bg-green-500",
  in_progress: "bg-orange-500",
  completed: "bg-emerald-600",
  cancelled: "bg-red-500",
  on_hold: "bg-yellow-500",
};

const priorityLabels: Record<string, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

const typeLabels: Record<string, string> = {
  renovation: "Rénovation",
  construction: "Construction",
  furniture: "Menuiserie",
  plumbing: "Plomberie",
  electricity: "Électricité",
  painting: "Peinture",
  custom: "Autre",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch project
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Project;
    },
  });

  // Fetch client if project has client_id
  const { data: client } = useQuery({
    queryKey: ["client", project?.client_id],
    queryFn: async () => {
      if (!project?.client_id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company_name")
        .eq("id", project.client_id)
        .single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!project?.client_id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projet supprimé");
      navigate("/projects");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-10">
            <span className="font-mono">{project.number}</span>
            <span>•</span>
            <span>
              Créé le {format(new Date(project.created_at), "d MMMM yyyy", { locale: fr })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
        </div>
      </div>

      {/* Status & Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[project.status]}>
                  {statusLabels[project.status]}
                </Badge>
                <Badge className={priorityColors[project.priority]}>
                  <Flag className="h-3 w-3 mr-1" />
                  {priorityLabels[project.priority]}
                </Badge>
                {project.type && (
                  <Badge variant="outline">{typeLabels[project.type] || project.type}</Badge>
                )}
              </div>
              {project.tags && project.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <TagIcon className="h-3 w-3 text-muted-foreground" />
                  {project.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{project.progress_percentage || 0}%</span>
              </div>
              <Progress value={project.progress_percentage || 0} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="time">Temps</TabsTrigger>
          <TabsTrigger value="materials">Matériaux</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        {/* Informations Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client</CardTitle>
              </CardHeader>
              <CardContent>
                {client ? (
                  <div className="space-y-2">
                    <p className="font-medium">{client.name || client.company_name}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      Voir la fiche client →
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucun client associé</p>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {(project.address || project.city) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {project.address && <p>{project.address}</p>}
                  {(project.postal_code || project.city) && (
                    <p>
                      {project.postal_code} {project.city}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {project.start_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Début :</span>
                    <span className="font-medium">
                      {format(new Date(project.start_date), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin prévue :</span>
                    <span className="font-medium">
                      {format(new Date(project.end_date), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {project.deadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline :</span>
                    <span className="font-medium text-orange-600">
                      {format(new Date(project.deadline), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {project.budget_quoted !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Devisé :</span>
                    <span className="font-medium">{project.budget_quoted.toFixed(2)} €</span>
                  </div>
                )}
                {project.budget_actual !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Réel :</span>
                    <span className="font-medium">{project.budget_actual.toFixed(2)} €</span>
                  </div>
                )}
                {project.estimated_hours !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Heures estimées :</span>
                    <span className="font-medium">{project.estimated_hours}h</span>
                  </div>
                )}
                {project.actual_hours !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Heures réelles :</span>
                    <span className="font-medium">{project.actual_hours}h</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tâches du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>La gestion des tâches sera implémentée prochainement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tab */}
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Pointages & Temps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Le suivi du temps sera implémenté prochainement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Matériaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>La gestion des matériaux sera implémentée prochainement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photos du chantier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>La galerie photos sera implémentée prochainement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finances Tab */}
        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Suivi financier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Le suivi financier détaillé sera implémenté prochainement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
