import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadQuotePDF } from "@/lib/quote-pdf-helper";
import { useOrgId } from "@/hooks/useOrgId";

export default function Quotes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orgId } = useOrgId();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Devis supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      if (!orgId) throw new Error("Organization ID not found");
      await downloadQuotePDF(quoteId, orgId);
    },
    onError: () => {
      toast.error("Erreur lors du téléchargement du PDF");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      sent: "secondary",
      accepted: "default",
      refused: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Devis</h1>
        <Button onClick={() => navigate("/quotes/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau devis
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des devis</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : quotes && quotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>{quote.clients?.name || "—"}</TableCell>
                    <TableCell>{getStatusBadge(quote.status || "draft")}</TableCell>
                    <TableCell className="text-right">{quote.totals_ttc} €</TableCell>
                    <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadMutation.mutate(quote.id)}
                          disabled={downloadMutation.isPending}
                        >
                          {downloadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(quote.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Aucun devis. Créez-en un pour commencer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
