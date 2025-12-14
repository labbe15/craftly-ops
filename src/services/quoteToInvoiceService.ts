import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { addDays, format } from "date-fns";

interface QuoteData {
  id: string;
  org_id: string;
  client_id: string;
  number: string;
  totals_ht: number;
  totals_vat: number;
  totals_ttc: number;
}

interface QuoteItem {
  description: string;
  qty: number;
  unit: string;
  unit_price_ht: number;
  vat_rate: number;
  line_total_ht: number;
}

export async function convertQuoteToInvoice(
  quoteId: string,
  paymentTermsDays: number = 30
): Promise<string> {
  try {
    // Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError) throw quoteError;
    if (!quote) throw new Error("Quote not found");

    // Fetch quote items
    const { data: quoteItems, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId);

    if (itemsError) throw itemsError;

    // Get org settings for invoice prefix
    const { data: orgSettings } = await supabase
      .from("org_settings")
      .select("invoice_prefix, payment_terms_days")
      .eq("org_id", quote.org_id)
      .single();

    const prefix = orgSettings?.invoice_prefix || "FACT-";
    const terms = orgSettings?.payment_terms_days || paymentTermsDays;

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("number")
      .eq("org_id", quote.org_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let invoiceNumber: string;
    if (lastInvoice?.number) {
      const lastNumber = parseInt(lastInvoice.number.replace(prefix, ""));
      invoiceNumber = `${prefix}${String(lastNumber + 1).padStart(5, "0")}`;
    } else {
      invoiceNumber = `${prefix}00001`;
    }

    // Create invoice
    const invoiceData: TablesInsert<"invoices"> = {
      org_id: quote.org_id,
      client_id: quote.client_id,
      quote_id: quoteId,
      number: invoiceNumber,
      status: "draft",
      currency: quote.currency || "EUR",
      due_date: addDays(new Date(), terms).toISOString(),
      totals_ht: quote.totals_ht,
      totals_vat: quote.totals_vat,
      totals_ttc: quote.totals_ttc,
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const invoiceItemsData = quoteItems.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
      line_total_ht: item.line_total_ht,
    }));

    const { error: invoiceItemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItemsData);

    if (invoiceItemsError) throw invoiceItemsError;

    return invoice.id;
  } catch (error) {
    console.error("Error converting quote to invoice:", error);
    throw error;
  }
}

export async function checkExistingInvoice(quoteId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (error) {
    console.error("Error checking existing invoice:", error);
    return false;
  }

  return !!data;
}
