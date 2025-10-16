import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: "Devis en attente", value: "0", icon: FileText, color: "text-primary" },
    { title: "Factures impayées", value: "0", icon: Receipt, color: "text-warning" },
    { title: "Encaissé ce mois", value: "0 €", icon: TrendingUp, color: "text-success" },
    { title: "Relances à venir", value: "0", icon: Clock, color: "text-destructive" },
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
