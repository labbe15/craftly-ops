import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function ItemForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      unit_price_ht: parseFloat(formData.get("unit_price_ht") as string),
      vat_rate: parseFloat(formData.get("vat_rate") as string),
      unit: formData.get("unit") as string,
      org_id: crypto.randomUUID(), // Temporary
    };

    const { error } = await supabase.from("items").insert(data);

    if (error) {
      toast.error("Erreur lors de la création de l'article");
      console.error(error);
    } else {
      toast.success("Article créé avec succès");
      navigate("/items");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/items")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Nouvel article</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'article *</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price_ht">Prix unitaire HT *</Label>
                <Input 
                  id="unit_price_ht" 
                  name="unit_price_ht" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_rate">Taux TVA (%) *</Label>
                <Select name="vat_rate" defaultValue="20">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5.5">5.5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <Select name="unit" defaultValue="u">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="u">Unité</SelectItem>
                  <SelectItem value="h">Heure</SelectItem>
                  <SelectItem value="j">Jour</SelectItem>
                  <SelectItem value="kg">Kilogramme</SelectItem>
                  <SelectItem value="m">Mètre</SelectItem>
                  <SelectItem value="m2">Mètre carré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/items")}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer l'article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
