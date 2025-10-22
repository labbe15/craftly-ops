import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  FileCheck,
  CreditCard,
  TrendingUp,
  Users,
  AlertCircle,
  Euro,
  Clock,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  // Fetch all data
  const { data: quotes } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id");
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Quotes statistics
  const totalQuotes = quotes?.length || 0;
  const acceptedQuotes = quotes?.filter((q) => q.status === "accepted").length || 0;
  const pendingQuotes = quotes?.filter((q) => q.status === "sent").length || 0;
  const currentMonthQuotes = quotes?.filter((q) => {
    const date = new Date(q.created_at);
    return date >= currentMonthStart && date <= currentMonthEnd;
  }).length || 0;

  // Invoices statistics
  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter((i) => i.status === "paid").length || 0;
  const overdueInvoices = invoices?.filter((i) => {
    if (i.status === "paid" || !i.due_date) return false;
    return isAfter(now, new Date(i.due_date));
  }).length || 0;

  // Revenue statistics
  const totalRevenue = invoices?.reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0;
  const paidRevenue = invoices
    ?.filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0;
  const pendingRevenue = totalRevenue - paidRevenue;

  const currentMonthRevenue = invoices
    ?.filter((i) => {
      const date = new Date(i.created_at);
      return date >= currentMonthStart && date <= currentMonthEnd;
    })
    .reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0;

  const lastMonthRevenue = invoices
    ?.filter((i) => {
      const date = new Date(i.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    })
    .reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0;

  const revenueGrowth = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Payment statistics
  const currentMonthPayments = payments
    ?.filter((p) => {
      const date = new Date(p.paid_at);
      return date >= currentMonthStart && date <= currentMonthEnd;
    })
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const totalClients = clients?.length || 0;

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendValue,
  }: {
    title: string;
    value: string | number;
    icon: any;
    description?: string;
    trend?: "up" | "down";
    trendValue?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trendValue && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={`h-3 w-3 ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            />
            <span
              className={`text-xs ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {trendValue}
            </span>
            <span className="text-xs text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={`${totalRevenue.toFixed(0)} €`}
          icon={Euro}
          description={`${paidRevenue.toFixed(0)} € encaissés`}
        />
        <StatCard
          title="CA ce mois"
          value={`${currentMonthRevenue.toFixed(0)} €`}
          icon={TrendingUp}
          trend={revenueGrowth >= 0 ? "up" : "down"}
          trendValue={`${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`}
        />
        <StatCard
          title="Factures"
          value={totalInvoices}
          icon={FileCheck}
          description={`${paidInvoices} payées, ${overdueInvoices} en retard`}
        />
        <StatCard
          title="Clients"
          value={totalClients}
          icon={Users}
          description="Clients actifs"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Devis"
          value={totalQuotes}
          icon={FileText}
          description={`${acceptedQuotes} acceptés, ${pendingQuotes} en attente`}
        />
        <StatCard
          title="Devis ce mois"
          value={currentMonthQuotes}
          icon={Clock}
          description="Nouveaux devis créés"
        />
        <StatCard
          title="À encaisser"
          value={`${pendingRevenue.toFixed(0)} €`}
          icon={CreditCard}
          description="Factures en attente"
        />
        <StatCard
          title="Paiements ce mois"
          value={`${currentMonthPayments.toFixed(0)} €`}
          icon={CreditCard}
          description="Montant encaissé"
        />
      </div>

      {/* Recent activity cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Derniers devis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotes && quotes.length > 0 ? (
              <div className="space-y-2">
                {quotes
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => window.location.href = `/quotes/${quote.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{quote.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(quote.created_at), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {quote.totals_ttc?.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {quote.status === "draft" && "Brouillon"}
                          {quote.status === "sent" && "Envoyé"}
                          {quote.status === "accepted" && "Accepté"}
                          {quote.status === "refused" && "Refusé"}
                          {quote.status === "expired" && "Expiré"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun devis
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Dernières factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => window.location.href = `/invoices/${invoice.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{invoice.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.created_at), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {invoice.totals_ttc?.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {invoice.status === "draft" && "Brouillon"}
                          {invoice.status === "sent" && "Envoyée"}
                          {invoice.status === "paid" && "Payée"}
                          {invoice.status === "overdue" && "En retard"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune facture
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueInvoices > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Factures en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Vous avez <strong>{overdueInvoices}</strong> facture(s) en retard.
              Pensez à relancer vos clients.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
