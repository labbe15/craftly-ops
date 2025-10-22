import { supabase } from "@/integrations/supabase/client";
import { generateQuotePDF } from "./pdf-generator";
import { toast } from "sonner";

export async function downloadQuotePDF(quoteId: string, orgId: string) {
  try {
    // Récupérer le devis complet
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*, clients(*)")
      .eq("id", quoteId)
      .single();

    if (quoteError) throw quoteError;

    // Récupérer les lignes
    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId);

    if (itemsError) throw itemsError;

    // Récupérer les settings
    const { data: settings } = await supabase
      .from("org_settings")
      .select("*")
      .eq("org_id", orgId)
      .single();

    // Générer le PDF
    generateQuotePDF(
      {
        number: quote.number,
        client: {
          name: quote.clients?.name || "",
          address: quote.clients?.address || "",
          email: quote.clients?.email || "",
          phone: quote.clients?.phone || "",
        },
        company: {
          name: settings?.company_name || "Votre Entreprise",
          address: settings?.address || "",
          phone: settings?.phone || "",
          email: "",
        },
        items: items.map((item) => ({
          description: item.description,
          quantity: item.qty,
          unit: item.unit,
          unit_price: item.unit_price_ht,
          vat_rate: item.vat_rate,
        })),
        totalHT: quote.totals_ht || 0,
        totalVAT: quote.totals_vat || 0,
        totalTTC: quote.totals_ttc || 0,
        createdAt: new Date(quote.created_at),
        expiresAt: quote.expires_at ? new Date(quote.expires_at) : undefined,
      },
      settings
        ? {
            brand_primary: settings.brand_primary || undefined,
            brand_secondary: settings.brand_secondary || undefined,
            footer_text: settings.footer_text || undefined,
            header_bg_url: settings.header_bg_url || undefined,
          }
        : undefined
    );

    toast.success("PDF téléchargé !");
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    toast.error("Erreur lors de la génération du PDF");
  }
}
