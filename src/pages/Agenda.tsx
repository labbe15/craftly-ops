import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Agenda() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agenda</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Calendrier</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Page agenda en cours de développement...</p>
        </CardContent>
      </Card>
    </div>
  );
}
