import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp, DollarSign, FileText, Users, Target, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export default function Analytics() {
  const [period, setPeriod] = useState("30"); // days

  // Calculate date range
  const endDate = new Date();
  const startDate = period === "30" ? subDays(endDate, 30) : period === "90" ? subDays(endDate, 90) : subDays(endDate, 365);

  // Fetch quotes
  const { data: quotes } = useQuery({
    queryKey: ["quotes", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ["invoices", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .gte("created_at", startDate.toISOString());
      if (error) throw error;
      return data;
    },
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate KPIs
  const kpis = {
    totalRevenue: invoices?.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.totals_ttc || 0), 0) || 0,
    avgQuoteValue: quotes?.length ? (quotes.reduce((sum, q) => sum + (q.totals_ttc || 0), 0) / quotes.length) : 0,
    quoteConversion: quotes?.length ? ((quotes.filter((q) => q.status === "accepted").length / quotes.length) * 100).toFixed(1) : "0",
    activeProjects: projects?.filter((p) => p.status === "in_progress").length || 0,
    totalClients: clients?.length || 0,
    avgProjectValue: projects?.length ? (projects.reduce((sum, p) => sum + (p.budget_quoted || 0), 0) / projects.length) : 0,
  };

  // Revenue evolution data
  const revenueData = Array.from({ length: parseInt(period) / 5 }, (_, i) => {
    const date = subDays(endDate, (parseInt(period) / 5 - i - 1) * 5);
    const dateStr = format(date, "dd/MM");
    const dayInvoices = invoices?.filter(
      (inv) =>
        inv.status === "paid" &&
        new Date(inv.created_at) >= date &&
        new Date(inv.created_at) < subDays(date, -5)
    ) || [];
    return {
      date: dateStr,
      revenue: dayInvoices.reduce((sum, i) => sum + (i.totals_ttc || 0), 0),
    };
  });

  // Quote status distribution
  const quoteStatusData = [
    { name: "Brouillon", value: quotes?.filter((q) => q.status === "draft").length || 0, color: "#94a3b8" },
    { name: "Envoyé", value: quotes?.filter((q) => q.status === "sent").length || 0, color: "#3b82f6" },
    { name: "Accepté", value: quotes?.filter((q) => q.status === "accepted").length || 0, color: "#10b981" },
    { name: "Refusé", value: quotes?.filter((q) => q.status === "rejected").length || 0, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  // Project status distribution
  const projectStatusData = [
    { name: "Lead", value: projects?.filter((p) => p.status === "lead").length || 0, color: "#94a3b8" },
    { name: "En cours", value: projects?.filter((p) => p.status === "in_progress").length || 0, color: "#f59e0b" },
    { name: "Terminé", value: projects?.filter((p) => p.status === "completed").length || 0, color: "#10b981" },
    { name: "Annulé", value: projects?.filter((p) => p.status === "cancelled").length || 0, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  // Monthly comparison (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthQuotes = quotes?.filter(
      (q) => new Date(q.created_at) >= start && new Date(q.created_at) <= end
    ) || [];
    const monthInvoices = invoices?.filter(
      (i) => i.status === "paid" && new Date(i.created_at) >= start && new Date(i.created_at) <= end
    ) || [];

    return {
      month: format(date, "MMM", { locale: fr }),
      quotes: monthQuotes.length,
      revenue: monthInvoices.reduce((sum, i) => sum + (i.totals_ttc || 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Visualisez vos performances et tendances</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Encaissé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalRevenue.toFixed(0)} €</div>
            <p className="text-xs text-muted-foreground">sur la période</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis moyen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgQuoteValue.toFixed(0)} €</div>
            <p className="text-xs text-muted-foreground">valeur moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.quoteConversion}%</div>
            <p className="text-xs text-muted-foreground">devis acceptés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeProjects}</div>
            <p className="text-xs text-muted-foreground">en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalClients}</div>
            <p className="text-xs text-muted-foreground">clients actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projet moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgProjectValue.toFixed(0)} €</div>
            <p className="text-xs text-muted-foreground">budget moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Évolution CA</TabsTrigger>
          <TabsTrigger value="quotes">Devis</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="comparison">Comparaison</TabsTrigger>
        </TabsList>

        {/* Revenue Evolution */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              <CardDescription>CA encaissé sur la période sélectionnée</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Analysis */}
        <TabsContent value="quotes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des devis</CardTitle>
                <CardDescription>Par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={quoteStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {quoteStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance devis</CardTitle>
                <CardDescription>Indicateurs clés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total devis</span>
                  <span className="text-2xl font-bold">{quotes?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Devis acceptés</span>
                  <span className="text-2xl font-bold text-green-600">
                    {quotes?.filter((q) => q.status === "accepted").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Devis refusés</span>
                  <span className="text-2xl font-bold text-red-600">
                    {quotes?.filter((q) => q.status === "rejected").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">En attente</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {quotes?.filter((q) => q.status === "sent").length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Analysis */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État des projets</CardTitle>
              <CardDescription>Répartition par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison mensuelle</CardTitle>
              <CardDescription>Devis et CA sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="quotes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Nombre de devis"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="CA (€)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
