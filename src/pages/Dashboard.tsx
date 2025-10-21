import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();

  // Query for pending quotes
  const { data: pendingQuotesCount = 0 } = useQuery({
    queryKey: ["pendingQuotes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");

      if (error) throw error;
      return count || 0;
    },
  });

  // Query for unpaid invoices
  const { data: unpaidInvoicesCount = 0 } = useQuery({
    queryKey: ["unpaidInvoices"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "overdue"]);

      if (error) throw error;
      return count || 0;
    },
  });

  // Query for revenue this month
  const { data: monthlyRevenue = 0 } = useQuery({
    queryKey: ["monthlyRevenue"],
    queryFn: async () => {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("invoices")
        .select("totals_ttc")
        .eq("status", "paid")
        .gte("paid_at", startDate.toISOString())
        .lte("paid_at", endDate.toISOString());

      if (error) throw error;

      return data.reduce((sum, invoice) => sum + (invoice.totals_ttc || 0), 0);
    },
  });

  // Query for overdue invoices
  const { data: overdueInvoicesCount = 0 } = useQuery({
    queryKey: ["overdueInvoices"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("status", "overdue");

      if (error) throw error;
      return count || 0;
    },
  });

  const stats = [
    { title: "Devis en attente", value: pendingQuotesCount.toString(), icon: FileText, color: "text-primary" },
    { title: "Factures impayées", value: unpaidInvoicesCount.toString(), icon: Receipt, color: "text-warning" },
    { title: "Encaissé ce mois", value: `${monthlyRevenue.toFixed(2)} €`, icon: TrendingUp, color: "text-success" },
    { title: "Relances à venir", value: overdueInvoicesCount.toString(), icon: Clock, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenue dans votre CRM artisan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate("/quotes/new")}>
              Créer un devis
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate("/invoices/new")}>
              Créer une facture
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate("/clients/new")}>
              Ajouter un client
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune activité récente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
