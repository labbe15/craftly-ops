import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function QuoteForm() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Nouveau devis</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer un devis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Formulaire de création de devis en cours de développement...</p>
        </CardContent>
      </Card>
    </div>
  );
}
