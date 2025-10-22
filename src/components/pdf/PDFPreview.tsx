import { useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { QuotePDF } from "@/components/pdf/QuotePDF";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

interface QuoteData {
  number: string;
  created_at: string;
  expires_at?: string;
  terms_text?: string;
  notes?: string;
  totals_ht: number;
  totals_vat: number;
  totals_ttc: number;
  client: {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    qty: number;
    unit: string;
    unit_price_ht: number;
    vat_rate: number;
    line_total_ht: number;
  }>;
}

interface InvoiceData {
  number: string;
  created_at: string;
  due_date?: string;
  notes?: string;
  totals_ht: number;
  totals_vat: number;
  totals_ttc: number;
  status: string;
  client: {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    qty: number;
    unit: string;
    unit_price_ht: number;
    vat_rate: number;
    line_total_ht: number;
  }>;
}

interface OrgSettings {
  company_name?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  brand_primary?: string;
  footer_text?: string;
}

interface PDFPreviewProps {
  type: "quote" | "invoice";
  data: QuoteData | InvoiceData;
  orgSettings?: OrgSettings;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  disabled?: boolean;
}

export function PDFPreview({
  type,
  data,
  orgSettings,
  triggerText = "Aperçu PDF",
  triggerVariant = "outline",
  disabled = false,
}: PDFPreviewProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setLoading(true);
      // Simulate loading time for PDF rendering
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} disabled={disabled}>
          <Eye className="h-4 w-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Aperçu du {type === "quote" ? "devis" : "facture"} - {data.number}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Génération de l'aperçu...
                </p>
              </div>
            </div>
          )}
          <div className="w-full h-full">
            {type === "quote" ? (
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                <QuotePDF
                  quote={data as QuoteData}
                  orgSettings={orgSettings}
                />
              </PDFViewer>
            ) : (
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                <InvoicePDF
                  invoice={data as InvoiceData}
                  orgSettings={orgSettings}
                />
              </PDFViewer>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
