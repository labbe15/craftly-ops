import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrgId } from "@/hooks/useOrgId";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_ht: number;
  vat_rate: number;
  total_ht: number;
}

export default function QuoteForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { orgId, isLoading: isLoadingOrgId } = useOrgId();
  const [items, setItems] = useState<QuoteItem[]>([]);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: catalogItems } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const addItem = () => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit: "u",
      unit_price_ht: 0,
      vat_rate: 20,
      total_ht: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculer le total
          updated.total_ht = updated.quantity * updated.unit_price_ht;
          return updated;
        }
        return item;
      })
    );
  };

  const selectCatalogItem = (id: string, catalogItemId: string) => {
    const catalogItem = catalogItems?.find((item) => item.id === catalogItemId);
    if (catalogItem) {
      updateItem(id, "description", catalogItem.name);
      updateItem(id, "unit_price_ht", catalogItem.unit_price_ht);
      updateItem(id, "vat_rate", catalogItem.vat_rate);
      updateItem(id, "unit", catalogItem.unit);
    }
  };

  const calculateTotals = () => {
    const totalHT = items.reduce((sum, item) => sum + item.total_ht, 0);
    const totalVAT = items.reduce(
      (sum, item) => sum + item.total_ht * (item.vat_rate / 100),
      0
    );
    const totalTTC = totalHT + totalVAT;
    return { totalHT, totalVAT, totalTTC };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!orgId) {
      toast.error("Organisation non trouvée");
      return;
    }

    if (items.length === 0) {
      toast.error("Ajoutez au moins un article au devis");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { totalHT, totalVAT, totalTTC } = calculateTotals();

    // Créer le devis
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        number: formData.get("number") as string,
        client_id: formData.get("client_id") as string,
        org_id: orgId,
        status: "draft",
        totals_ht: totalHT,
        totals_vat: totalVAT,
        totals_ttc: totalTTC,
        notes: formData.get("notes") as string,
        terms_text: formData.get("terms_text") as string,
      })
      .select()
      .single();

    if (quoteError) {
      toast.error("Erreur lors de la création du devis");
      console.error(quoteError);
      setLoading(false);
      return;
    }

    // Créer les lignes
    const quoteItems = items.map((item) => ({
      quote_id: quote.id,
      description: item.description,
      qty: item.quantity,
      unit: item.unit,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
      line_total_ht: item.total_ht,
    }));

    const { error: itemsError } = await supabase.from("quote_items").insert(quoteItems);

    if (itemsError) {
      toast.error("Erreur lors de l'ajout des articles");
      console.error(itemsError);
      // Supprimer le devis créé
      await supabase.from("quotes").delete().eq("id", quote.id);
      setLoading(false);
      return;
    }

    toast.success("Devis créé avec succès !");
    navigate("/quotes");
    setLoading(false);
  };

  if (isLoadingOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  const { totalHT, totalVAT, totalTTC } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Nouveau devis</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Numéro du devis *</Label>
                <Input
                  id="number"
                  name="number"
                  required
                  placeholder="DEV-2025-001"
                  defaultValue={`DEV-${new Date().getFullYear()}-${String(
                    new Date().getTime()
                  ).slice(-4)}`}
                />
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
          </CardContent>
        </Card>

        {/* Articles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun article. Cliquez sur "Ajouter une ligne" pour commencer.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead className="w-[100px]">Qté</TableHead>
                    <TableHead className="w-[80px]">Unité</TableHead>
                    <TableHead className="w-[120px]">Prix HT</TableHead>
                    <TableHead className="w-[80px]">TVA %</TableHead>
                    <TableHead className="text-right w-[120px]">Total HT</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-2">
                          {catalogItems && catalogItems.length > 0 && (
                            <Select
                              onValueChange={(value) => selectCatalogItem(item.id, value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Depuis le catalogue..." />
                              </SelectTrigger>
                              <SelectContent>
                                {catalogItems.map((catalogItem) => (
                                  <SelectItem key={catalogItem.id} value={catalogItem.id}>
                                    {catalogItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            placeholder="Description..."
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                          maxLength={10}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price_ht}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unit_price_ht",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.vat_rate.toString()}
                          onValueChange={(value) =>
                            updateItem(item.id, "vat_rate", parseFloat(value))
                          }
                        >
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
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.total_ht.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totaux */}
            {items.length > 0 && (
              <div className="flex justify-end mt-6">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total HT</span>
                    <span className="font-medium">{totalHT.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total TVA</span>
                    <span className="font-medium">{totalVAT.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC</span>
                    <span>{totalTTC.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes et conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Notes et conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Notes visibles uniquement par vous..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_text">Conditions (affichées sur le devis)</Label>
              <Textarea
                id="terms_text"
                name="terms_text"
                rows={4}
                placeholder="Conditions de paiement, garanties, validité..."
                defaultValue="Devis valable 30 jours. Acompte de 30% à la commande. Solde à la livraison."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/quotes")}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading || items.length === 0}>
            {loading ? "Création..." : "Créer le devis"}
          </Button>
        </div>
      </form>
    </div>
  );
}
