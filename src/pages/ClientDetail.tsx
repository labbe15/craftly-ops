import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit,
  FileText,
  FileCheck,
  TrendingUp,
  Euro,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch client
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) throw new Error("No client ID");
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch client's quotes
  const { data: quotes } = useQuery({
    queryKey: ["client-quotes", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch client's invoices
  const { data: invoices } = useQuery({
    queryKey: ["client-invoices", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Calculate stats
  const stats = {
    totalQuotes: quotes?.length || 0,
    acceptedQuotes: quotes?.filter((q) => q.status === "accepted").length || 0,
    totalInvoices: invoices?.length || 0,
    paidInvoices: invoices?.filter((i) => i.status === "paid").length || 0,
    totalRevenue: invoices?.reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0,
    paidRevenue:
      invoices
        ?.filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0,
  };

  const getQuoteStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      draft: "outline",
      sent: "secondary",
      accepted: "default",
      refused: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyé",
      accepted: "Accepté",
      refused: "Refusé",
      expired: "Expiré",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      draft: "outline",
      sent: "secondary",
      paid: "default",
      overdue: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyée",
      paid: "Payée",
      overdue: "En retard",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Client introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">
              Client depuis le{" "}
              {format(new Date(client.created_at), "dd MMMM yyyy", {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/clients/${client.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Client Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.contact_name && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Contact:</span>
                <span>{client.contact_name}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${client.email}`}
                  className="text-primary hover:underline"
                >
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${client.phone}`}
                  className="text-primary hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <span className="whitespace-pre-line">{client.address}</span>
              </div>
            )}
            {client.notes && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chiffre d'affaires
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRevenue.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.paidRevenue.toFixed(2)} € encaissés
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devis</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuotes}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.acceptedQuotes} acceptés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Factures</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.paidInvoices} payées
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Devis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotes && quotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>
                      {format(new Date(quote.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {getQuoteStatusBadge(quote.status || "draft")}
                    </TableCell>
                    <TableCell className="text-right">
                      {quote.totals_ttc?.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun devis pour ce client
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <TableCell className="font-medium">
                      {invoice.number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {getInvoiceStatusBadge(invoice.status || "draft")}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.totals_ttc?.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune facture pour ce client
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
