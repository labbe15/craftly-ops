import { useNavigate, useParams } from "react-router-dom";
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
import { useOrgId } from "@/hooks/useOrgId";
import { useQuery } from "@tanstack/react-query";

export default function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const { orgId, isLoading: isLoadingOrgId } = useOrgId();

  const isEditMode = !!id;

  // Fetch item data if in edit mode
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!orgId) {
      toast.error("Organisation non trouvée");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      unit_price_ht: parseFloat(formData.get("unit_price_ht") as string),
      vat_rate: parseFloat(formData.get("vat_rate") as string),
      unit: formData.get("unit") as string,
      org_id: orgId,
    };

    let error;
    if (isEditMode && id) {
      const result = await supabase.from("items").update(data).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from("items").insert(data);
      error = result.error;
    }

    if (error) {
      toast.error(`Erreur lors de ${isEditMode ? "la modification" : "la création"} de l'article`);
      console.error(error);
    } else {
      toast.success(`Article ${isEditMode ? "modifié" : "créé"} avec succès`);
      navigate("/items");
    }

    setLoading(false);
  };

  if (isLoadingOrgId || isLoadingItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/items")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? "Modifier l'article" : "Nouvel article"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'article *</Label>
              <Input id="name" name="name" required defaultValue={item?.name || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={item?.description || ""} />
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
                  defaultValue={item?.unit_price_ht || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_rate">Taux TVA (%) *</Label>
                <Select name="vat_rate" defaultValue={item?.vat_rate?.toString() || "20"}>
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
              <Select name="unit" defaultValue={item?.unit || "u"}>
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
                {loading ? (isEditMode ? "Modification..." : "Création...") : (isEditMode ? "Modifier l'article" : "Créer l'article")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
