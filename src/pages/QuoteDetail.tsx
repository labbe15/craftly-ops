import { useNavigate, useParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, FileDown, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import { QuotePDF } from "@/components/pdf/QuotePDF";
import { PDFPreview } from "@/components/pdf/PDFPreview";
import { SendEmailDialog } from "@/components/email/SendEmailDialog";

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

export default function QuoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [quoteNumber, setQuoteNumber] = useState<string>("");
  const [status, setStatus] = useState<string>("draft");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [termsText, setTermsText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);

  // Fetch quote
  const { data: quote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      if (!id) throw new Error("No quote ID");
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch quote items
  const { data: quoteItems } = useQuery({
    queryKey: ["quoteItems", id],
    queryFn: async () => {
      if (!id) throw new Error("No quote ID");
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  // Fetch org settings
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

  // Load quote data into form
  useEffect(() => {
    if (quote) {
      setQuoteNumber(quote.number);
      setSelectedClientId(quote.client_id || "");
      setStatus(quote.status || "draft");
      setExpiresAt(
        quote.expires_at ? format(new Date(quote.expires_at), "yyyy-MM-dd") : ""
      );
      setTermsText(quote.terms_text || "");
      setNotes(quote.notes || "");
    }
  }, [quote]);

  // Load quote items
  useEffect(() => {
    if (quoteItems && quoteItems.length > 0) {
      setLineItems(
        quoteItems.map((item) => ({
          id: item.id,
          item_id: item.item_id || undefined,
          description: item.description,
          qty: Number(item.qty),
          unit: item.unit || "u",
          unit_price_ht: Number(item.unit_price_ht),
          vat_rate: Number(item.vat_rate),
          line_total_ht: Number(item.line_total_ht),
        }))
      );
    }
  }, [quoteItems]);

  const updateLineItem = (
    id: string,
    field: keyof QuoteLineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.line_total_ht = updated.qty * updated.unit_price_ht;
        return updated;
      })
    );
  };

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

  const removeLine = (lineId: string) => {
    if (lineItems.length === 1) {
      toast.error("Il doit y avoir au moins une ligne");
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== lineId));
  };

  // Calculate totals
  const totals_ht = lineItems.reduce((sum, item) => sum + item.line_total_ht, 0);
  const totals_vat = lineItems.reduce((sum, item) => {
    const vat = (item.line_total_ht * item.vat_rate) / 100;
    return sum + vat;
  }, 0);
  const totals_ttc = totals_ht + totals_vat;

  // Prepare preview data
  const previewData = useMemo(() => {
    const selectedClient = clients?.find((c) => c.id === selectedClientId);

    if (!quote || !selectedClient || lineItems.some((item) => !item.description.trim())) {
      return null;
    }

    return {
      number: quoteNumber,
      created_at: quote.created_at,
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
    quote,
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

      // Update quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          number: quoteNumber,
          client_id: selectedClientId,
          status,
          expires_at: expiresAt,
          terms_text: termsText,
          notes: notes,
          totals_ht,
          totals_vat,
          totals_ttc,
        })
        .eq("id", id);

      if (quoteError) throw quoteError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", id);

      if (deleteError) throw deleteError;

      // Insert new items
      const quoteItemsData = lineItems.map((item) => ({
        quote_id: id,
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

      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      queryClient.invalidateQueries({ queryKey: ["quoteItems", id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Devis mis à jour avec succès");
    } catch (error) {
      console.error("Error updating quote:", error);
      toast.error("Erreur lors de la mise à jour du devis");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setDownloadingPDF(true);

      const pdfData = {
        ...quote,
        client: quote?.clients,
        items: lineItems,
      };

      const blob = await pdf(
        <QuotePDF quote={pdfData} orgSettings={orgSettings || undefined} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `devis-${quoteNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Erreur lors du téléchargement du PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      draft: "outline",
      sent: "secondary",
      accepted: "default",
      refused: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyé",
      accepted: "Accepté",
      refused: "Refusé",
      expired: "Expiré",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoadingQuote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Devis introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/quotes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Devis {quoteNumber}</h1>
            <div className="mt-2">{getStatusBadge(status)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {previewData && (
            <PDFPreview
              type="quote"
              data={previewData}
              orgSettings={orgSettings || undefined}
              triggerText="Aperçu"
              triggerVariant="outline"
            />
          )}
          {previewData && quote?.clients?.email && (
            <SendEmailDialog
              type="quote"
              documentId={quote.id}
              documentNumber={quoteNumber}
              documentData={previewData}
              orgSettings={orgSettings || undefined}
              orgId={quote.org_id}
              clientEmail={quote.clients.email}
              clientName={quote.clients.name}
            />
          )}
          <Button onClick={downloadPDF} disabled={downloadingPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            {downloadingPDF ? "Téléchargement..." : "Télécharger PDF"}
          </Button>
        </div>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="sent">Envoyé</SelectItem>
                    <SelectItem value="accepted">Accepté</SelectItem>
                    <SelectItem value="refused">Refusé</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                  </SelectContent>
                </Select>
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
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes du devis</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLine}
              >
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

                    <div className="col-span-4 md:col-span-1">
                      <Label className="text-xs">Qté</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.qty}
                        onChange={(e) =>
                          updateLineItem(
                            line.id,
                            "qty",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-9"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-1">
                      <Label className="text-xs">Unité</Label>
                      <Select
                        value={line.unit}
                        onValueChange={(value) =>
                          updateLineItem(line.id, "unit", value)
                        }
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

                    <div className="col-span-5 md:col-span-1">
                      <Label className="text-xs">Total HT</Label>
                      <Input
                        value={line.line_total_ht.toFixed(2)}
                        disabled
                        className="h-9 bg-muted"
                      />
                    </div>

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
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
