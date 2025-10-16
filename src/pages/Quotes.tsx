import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Quotes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Devis</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des devis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Page devis en cours de développement...</p>
        </CardContent>
      </Card>
    </div>
  );
}
