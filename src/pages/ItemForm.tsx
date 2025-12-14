import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPriceHT, setUnitPriceHT] = useState("");
  const [buyingPriceHT, setBuyingPriceHT] = useState("");
  const [category, setCategory] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const [unit, setUnit] = useState("u");
  const [isActive, setIsActive] = useState(true);

  // Fetch item if editing
  const { data: item } = useQuery({
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

  // Fetch user's org_id
  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("org_id")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setDescription(item.description || "");
      setUnitPriceHT(item.unit_price_ht?.toString() || "");
      setBuyingPriceHT(item.buying_price_ht?.toString() || "");
      setCategory(item.category || "");
      setVatRate(item.vat_rate?.toString() || "20");
      setUnit(item.unit || "u");
      setIsActive(item.is_active ?? true);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!orgSettings?.org_id) {
        toast.error("Organisation non trouvée");
        return;
      }

      const data = {
        name,
        description: description || null,
        unit_price_ht: parseFloat(unitPriceHT),
        buying_price_ht: buyingPriceHT ? parseFloat(buyingPriceHT) : null,
        category: category || null,
        vat_rate: parseFloat(vatRate),
        unit,
        is_active: isActive,
        org_id: orgSettings.org_id,
      };

      if (id) {
        // Update existing item
        const { error } = await supabase
          .from("items")
          .update(data)
          .eq("id", id);

        if (error) throw error;
        toast.success("Article mis à jour avec succès");
      } else {
        // Create new item
        const { error } = await supabase.from("items").insert(data);

        if (error) throw error;
        toast.success("Article créé avec succès");
      }

      navigate("/items");
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Erreur lors de ${id ? "la mise à jour" : "la création"} de l'article`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/items")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {id ? "Modifier l'article" : "Nouvel article"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'article *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Prestation de plomberie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Description détaillée de l'article ou de la prestation..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Main d'oeuvre / Service</SelectItem>
                    <SelectItem value="material">Matériel / Fourniture</SelectItem>
                    <SelectItem value="travel">Déplacement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_rate">Taux TVA (%) *</Label>
                <Select value={vatRate} onValueChange={setVatRate}>
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

              <div className="space-y-2">
                <Label htmlFor="unit">Unité *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="u">Unité (u)</SelectItem>
                    <SelectItem value="h">Heure (h)</SelectItem>
                    <SelectItem value="j">Jour (j)</SelectItem>
                    <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                    <SelectItem value="m">Mètre (m)</SelectItem>
                    <SelectItem value="m2">Mètre carré (m²)</SelectItem>
                    <SelectItem value="m3">Mètre cube (m³)</SelectItem>
                    <SelectItem value="l">Litre (l)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <h3 className="font-semibold text-sm">Prix et Rentabilité</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buying_price_ht">Coût d'achat HT (€)</Label>
                  <Input
                    id="buying_price_ht"
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyingPriceHT}
                    onChange={(e) => setBuyingPriceHT(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Votre coût de revient (achat matériel, sous-traitance...)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price_ht">Prix de vente HT (€) *</Label>
                  <Input
                    id="unit_price_ht"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPriceHT}
                    onChange={(e) => setUnitPriceHT(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {unitPriceHT && buyingPriceHT && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex justify-between items-center">
                  <span>Marge théorique :</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {(parseFloat(unitPriceHT) - parseFloat(buyingPriceHT)).toFixed(
                        2
                      )}{" "}
                      €
                    </span>
                    <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded-full">
                      {Math.round(
                        ((parseFloat(unitPriceHT) - parseFloat(buyingPriceHT)) /
                          parseFloat(unitPriceHT)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Article actif (visible dans les devis et factures)
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/items")}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading
                  ? id
                    ? "Enregistrement..."
                    : "Création..."
                  : id
                  ? "Enregistrer"
                  : "Créer l'article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
