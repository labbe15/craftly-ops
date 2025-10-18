import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      number: formData.get("number") as string,
      client_id: formData.get("client_id") as string,
      org_id: crypto.randomUUID(), // Temporary
      status: "draft",
    };

    const { error } = await supabase.from("invoices").insert(data);

    if (error) {
      toast.error("Erreur lors de la création de la facture");
      console.error(error);
    } else {
      toast.success("Facture créée avec succès");
      navigate("/invoices");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Nouvelle facture</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer une facture</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Numéro de facture *</Label>
                <Input id="number" name="number" required placeholder="FACT-2025-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select name="client_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer la facture"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
