import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Items() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Articles</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Catalogue d'articles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Page articles en cours de développement...</p>
        </CardContent>
      </Card>
    </div>
  );
}
