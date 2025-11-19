import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Workflow, Zap, Plus, MoreVertical, Play, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Workflows() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch workflow executions
  const { data: executions } = useQuery({
    queryKey: ["workflow_executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_executions")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Toggle workflow active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("workflows")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete workflow
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le workflow "${name}" ?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Get trigger label
  const getTriggerLabel = (trigger: any) => {
    const labels: Record<string, string> = {
      quote_status_changed: "Devis - Changement de statut",
      invoice_status_changed: "Facture - Changement de statut",
      project_status_changed: "Projet - Changement de statut",
      client_created: "Client créé",
      scheduled: "Programmé",
    };
    return labels[trigger?.type] || trigger?.type || "N/A";
  };

  // Get action count
  const getActionCount = (actions: any[]) => {
    return actions?.length || 0;
  };

  // Calculate stats
  const stats = {
    total: workflows?.length || 0,
    active: workflows?.filter((w) => w.active).length || 0,
    executions: executions?.length || 0,
    successRate: executions?.length
      ? ((executions.filter((e) => e.status === "success").length / executions.length) * 100).toFixed(0)
      : "0",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Zap className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Automatisez vos tâches répétitives</p>
        </div>
        <Button onClick={() => navigate("/workflows/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.executions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle>Vos workflows</CardTitle>
          <CardDescription>Gérez vos automatisations</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows && workflows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Déclencheur</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière exécution</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => {
                  const lastExecution = executions?.find((e) => e.workflow_id === workflow.id);

                  return (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          {workflow.description && (
                            <div className="text-sm text-muted-foreground">{workflow.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTriggerLabel(workflow.trigger)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getActionCount(workflow.actions)} action(s)</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={workflow.active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: workflow.id, active: checked })
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {workflow.active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lastExecution ? (
                          <div className="flex items-center gap-2">
                            {lastExecution.status === "success" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(lastExecution.executed_at), "dd/MM HH:mm", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/workflows/${workflow.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(workflow.id, workflow.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Aucun workflow créé. Créez votre premier workflow pour automatiser vos tâches !
              </p>
              <Button className="mt-4" onClick={() => navigate("/workflows/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick templates */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de workflows</CardTitle>
          <CardDescription>Démarrez rapidement avec des workflows pré-configurés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">📧 Devis accepté → Projet</h4>
                <p className="text-sm text-muted-foreground">
                  Créer automatiquement un projet quand un devis est accepté
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">💰 Facture → Relance</h4>
                <p className="text-sm text-muted-foreground">
                  Programmer une relance automatique pour les factures impayées
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">✅ Projet terminé → Merci</h4>
                <p className="text-sm text-muted-foreground">
                  Envoyer un email de remerciement quand un projet est complété
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
