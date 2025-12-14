import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { PDFPreview } from "@/components/pdf/PDFPreview";
import { ClientDialogForm } from "@/components/clients/ClientDialogForm";

interface QuoteLineItem {
  id: string;
  item_id?: string;
  description: string;
  qty: number;
  unit: string;
  unit_price_ht: number;
  vat_rate: number;
  line_total_ht: number;
}

export default function QuoteForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [quoteNumber, setQuoteNumber] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>(
    format(addDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [termsText, setTermsText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      qty: 1,
      unit: "u",
      unit_price_ht: 0,
      vat_rate: 20,
      line_total_ht: 0,
    },
  ]);

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch items catalog
  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch org settings for defaults
  const { data: orgSettings } = useQuery({
    queryKey: ["orgSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Set default quote number based on org settings
  useEffect(() => {
    if (orgSettings?.quote_prefix && !quoteNumber) {
      const prefix = orgSettings.quote_prefix;
      const date = format(new Date(), "yyyyMM");
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      setQuoteNumber(`${prefix}${date}-${random}`);
    }
  }, [orgSettings, quoteNumber]);

  // Set default terms text
  useEffect(() => {
    if (!termsText && orgSettings?.footer_text) {
      setTermsText(
        `Devis valable 30 jours.\nAcompte de 30% à la commande.\n\n${orgSettings.footer_text}`
      );
    }
  }, [orgSettings, termsText]);

  // Calculate line total when qty or price changes
  const updateLineItem = (
    id: string,
    field: keyof QuoteLineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate line total
        updated.line_total_ht = updated.qty * updated.unit_price_ht;

        return updated;
      })
    );
  };

  // Fill line item from catalog
  const selectCatalogItem = (lineId: string, itemId: string) => {
    const catalogItem = items?.find((i) => i.id === itemId);
    if (!catalogItem) return;

    setLineItems((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;

        return {
          ...line,
          item_id: itemId,
          description: catalogItem.name,
          unit_price_ht: Number(catalogItem.unit_price_ht),
          vat_rate: Number(catalogItem.vat_rate),
          unit: catalogItem.unit || "u",
          line_total_ht: line.qty * Number(catalogItem.unit_price_ht),
        };
      })
    );
  };

  // Add new line
  const addLine = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        qty: 1,
        unit: "u",
        unit_price_ht: 0,
        vat_rate: orgSettings?.default_vat_rate || 20,
        line_total_ht: 0,
      },
    ]);
  };

  // Remove line
  const removeLine = (id: string) => {
    if (lineItems.length === 1) {
      toast.error("Il doit y avoir au moins une ligne");
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate totals
  const totals_ht = lineItems.reduce(
    (sum, item) => sum + item.line_total_ht,
    0
  );
  const totals_vat = lineItems.reduce((sum, item) => {
    const vat = (item.line_total_ht * item.vat_rate) / 100;
    return sum + vat;
  }, 0);
  const totals_ttc = totals_ht + totals_vat;

  // Prepare preview data
  const previewData = useMemo(() => {
    const selectedClient = clients?.find((c) => c.id === selectedClientId);

    if (!selectedClient || lineItems.some((item) => !item.description.trim())) {
      return null;
    }

    return {
      number: quoteNumber || "DEV-PREVIEW",
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      terms_text: termsText,
      notes: notes,
      totals_ht,
      totals_vat,
      totals_ttc,
      client: {
        name: selectedClient.name,
        contact_name: selectedClient.contact_name || undefined,
        email: selectedClient.email || undefined,
        phone: selectedClient.phone || undefined,
        address: selectedClient.address || undefined,
      },
      items: lineItems.map((item) => ({
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        unit_price_ht: item.unit_price_ht,
        vat_rate: item.vat_rate,
        line_total_ht: item.line_total_ht,
      })),
    };
  }, [
    clients,
    selectedClientId,
    quoteNumber,
    expiresAt,
    termsText,
    notes,
    lineItems,
    totals_ht,
    totals_vat,
    totals_ttc,
  ]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!orgSettings?.org_id) {
        toast.error("Organisation non trouvée");
        setLoading(false);
        return;
      }

      if (!selectedClientId) {
        toast.error("Veuillez sélectionner un client");
        setLoading(false);
        return;
      }

      if (lineItems.some((item) => !item.description.trim())) {
        toast.error("Toutes les lignes doivent avoir une description");
        setLoading(false);
        return;
      }

      // Insert quote
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          number: quoteNumber,
          client_id: selectedClientId,
          org_id: orgSettings.org_id,
          status: "draft",
          expires_at: expiresAt,
          terms_text: termsText,
          notes: notes,
          totals_ht,
          totals_vat,
          totals_ttc,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert quote items
      const quoteItemsData = lineItems.map((item) => ({
        quote_id: quoteData.id,
        item_id: item.item_id || null,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        unit_price_ht: item.unit_price_ht,
        vat_rate: item.vat_rate,
        line_total_ht: item.line_total_ht,
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(quoteItemsData);

      if (itemsError) throw itemsError;

      toast.success("Devis créé avec succès");
      navigate("/quotes");
    } catch (error) {
      console.error("Error creating quote:", error);
      toast.error("Erreur lors de la création du devis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Nouveau devis</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Numéro du devis *</Label>
                <Input
                  id="number"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  required
                  placeholder="DEV-202501-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    required
                  >
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
                  <ClientDialogForm
                    orgId={orgSettings?.org_id}
                    onClientCreated={(id) => {
                      queryClient.invalidateQueries({ queryKey: ["clients"] });
                      setSelectedClientId(id);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Date d'expiration</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes du devis</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((line, index) => (
                <div key={line.id} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="grid grid-cols-12 gap-3 items-start">
                    {/* Catalog Item Selector */}
                    <div className="col-span-12 md:col-span-3">
                      <Label className="text-xs">Article du catalogue</Label>
                      <Select
                        value={line.item_id || "manual"}
                        onValueChange={(value) => {
                          if (value === "manual") {
                            updateLineItem(line.id, "item_id", "");
                          } else {
                            selectCatalogItem(line.id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Saisie manuelle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Saisie manuelle</SelectItem>
                          {items?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.unit_price_ht}€
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="col-span-12 md:col-span-3">
                      <Label className="text-xs">Description *</Label>
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          updateLineItem(line.id, "description", e.target.value)
                        }
                        placeholder="Description"
                        required
                        className="h-9"
                      />
                    </div>

                    {/* Qty */}
                    <div className="col-span-4 md:col-span-1">
                      <Label className="text-xs">Qté</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.qty}
                        onChange={(e) =>
                          updateLineItem(line.id, "qty", parseFloat(e.target.value) || 0)
                        }
                        className="h-9"
                      />
                    </div>

                    {/* Unit */}
                    <div className="col-span-4 md:col-span-1">
                      <Label className="text-xs">Unité</Label>
                      <Select
                        value={line.unit}
                        onValueChange={(value) => updateLineItem(line.id, "unit", value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="u">u</SelectItem>
                          <SelectItem value="h">h</SelectItem>
                          <SelectItem value="j">j</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="m2">m²</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price HT */}
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs">Prix HT</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unit_price_ht}
                        onChange={(e) =>
                          updateLineItem(
                            line.id,
                            "unit_price_ht",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-9"
                      />
                    </div>

                    {/* VAT */}
                    <div className="col-span-6 md:col-span-1">
                      <Label className="text-xs">TVA</Label>
                      <Select
                        value={line.vat_rate.toString()}
                        onValueChange={(value) =>
                          updateLineItem(line.id, "vat_rate", parseFloat(value))
                        }
                      >
                        <SelectTrigger className="h-9">
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

                    {/* Total */}
                    <div className="col-span-5 md:col-span-1">
                      <Label className="text-xs">Total HT</Label>
                      <Input
                        value={line.line_total_ht.toFixed(2)}
                        disabled
                        className="h-9 bg-muted"
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.id)}
                        className="h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <Separator className="my-6" />
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total HT:</span>
                  <span>{totals_ht.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total TVA:</span>
                  <span>{totals_vat.toFixed(2)} €</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC:</span>
                  <span>{totals_ttc.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions et notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms_text">Conditions du devis</Label>
              <Textarea
                id="terms_text"
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                placeholder="Conditions de paiement, garanties, etc."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visibles uniquement en interne"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/quotes")}
          >
            Annuler
          </Button>
          {previewData && (
            <PDFPreview
              type="quote"
              data={previewData}
              orgSettings={orgSettings || undefined}
              triggerText="Aperçu PDF"
              triggerVariant="outline"
            />
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer le devis"}
          </Button>
        </div>
      </form>
    </div>
  );
}
