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
import { ArrowLeft, Save, Calculator } from "lucide-react";
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
  const [buyingPriceHT, setBuyingPriceHT] = useState("0"); // Nouveau champ
  const [category, setCategory] = useState(""); // Nouveau champ
  const [vatRate, setVatRate] = useState("20");
  const [unit, setUnit] = useState("u");
  const [isActive, setIsActive] = useState(true);

  // Calcul dynamique de la marge
  const margin = parseFloat(unitPriceHT || "0") - parseFloat(buyingPriceHT || "0");
  const marginPercent = parseFloat(unitPriceHT) > 0 
    ? ((margin / parseFloat(unitPriceHT)) * 100).toFixed(1) 
    : "0";

  const { data: item } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("items").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings").select("org_id").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setDescription(item.description || "");
      setUnitPriceHT(item.unit_price_ht?.toString() || "");
      setBuyingPriceHT(item.buying_price_ht?.toString() || "0");
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
        buying_price_ht: parseFloat(buyingPriceHT),
        category: category || null,
        vat_rate: parseFloat(vatRate),
        unit,
        is_active: isActive,
        org_id: orgSettings.org_id,
      };

      if (id) {
        await supabase.from("items").update(data).eq("id", id);
        toast.success("Article mis à jour");
      } else {
        await supabase.from("items").insert(data);
        toast.success("Article créé");
      }
      navigate("/items");
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
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
        <h1 className="text-3xl font-bold">{id ? "Modifier l'article" : "Nouvel article"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de l'article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_d_oeuvre">Main d'oeuvre</SelectItem>
                    <SelectItem value="materiel">Matériel</SelectItem>
                    <SelectItem value="deplacement">Déplacement</SelectItem>
                    <SelectItem value="sous_traitance">Sous-traitance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Prix et Rentabilité</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="buying_price_ht">Coût d'achat HT (€)</Label>
                    <Input type="number" step="0.01" value={buyingPriceHT} onChange={(e) => setBuyingPriceHT(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unit_price_ht">Prix de vente HT (€) *</Label>
                    <Input type="number" step="0.01" value={unitPriceHT} onChange={(e) => setUnitPriceHT(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Marge</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-green-50 text-green-700 font-medium">
                        {margin.toFixed(2)} € ({marginPercent}%)
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vat_rate">TVA (%)</Label>
                    <Select value={vatRate} onValueChange={setVatRate}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5.5">5.5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="unit">Unité</Label>
                    <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="u">Unité (u)</SelectItem>
                            <SelectItem value="h">Heure (h)</SelectItem>
                            <SelectItem value="j">Jour (j)</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="m2">m²</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center space-x-2 pt-8">
                    <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                    <Label htmlFor="is_active">Article actif</Label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/items")}>Annuler</Button>
              <Button type="submit" disabled={loading}><Save className="h-4 w-4 mr-2" />Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
