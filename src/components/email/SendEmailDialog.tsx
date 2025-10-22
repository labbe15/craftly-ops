import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, generateQuoteEmailHTML, generateInvoiceEmailHTML } from "@/services/emailService";
import { pdf } from "@react-pdf/renderer";
import { QuotePDF } from "@/components/pdf/QuotePDF";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

interface SendEmailDialogProps {
  type: "quote" | "invoice";
  documentId: string;
  documentNumber: string;
  documentData: any;
  orgSettings?: any;
  orgId: string;
  clientEmail?: string;
  clientName: string;
  disabled?: boolean;
}

export function SendEmailDialog({
  type,
  documentId,
  documentNumber,
  documentData,
  orgSettings,
  orgId,
  clientEmail,
  clientName,
  disabled,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [toEmail, setToEmail] = useState(clientEmail || "");
  const [subject, setSubject] = useState(
    type === "quote"
      ? `Devis ${documentNumber} - ${orgSettings?.company_name || "Votre entreprise"}`
      : `Facture ${documentNumber} - ${orgSettings?.company_name || "Votre entreprise"}`
  );
  const [message, setMessage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      // Generate PDF as base64
      const PDFComponent = type === "quote"
        ? <QuotePDF quote={documentData} orgSettings={orgSettings} />
        : <InvoicePDF invoice={documentData} orgSettings={orgSettings} />;

      const pdfBlob = await pdf(PDFComponent).toBlob();
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });

      // Generate email HTML
      const emailHTML = type === "quote"
        ? generateQuoteEmailHTML({
            clientName,
            quoteNumber: documentNumber,
            companyName: orgSettings?.company_name || "Votre entreprise",
            expiresAt: documentData.expires_at,
            totals_ttc: documentData.totals_ttc,
            brandPrimary: orgSettings?.brand_primary,
          })
        : generateInvoiceEmailHTML({
            clientName,
            invoiceNumber: documentNumber,
            companyName: orgSettings?.company_name || "Votre entreprise",
            dueDate: documentData.due_date,
            totals_ttc: documentData.totals_ttc,
            brandPrimary: orgSettings?.brand_primary,
          });

      // Send email with PDF attachment
      const result = await sendEmail({
        to: toEmail,
        subject,
        html: emailHTML,
        orgId,
        relatedType: type,
        relatedId: documentId,
        templateKey: type === "quote" ? "quote_email" : "invoice_email",
      });

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: `Le ${type === "quote" ? "devis" : "la facture"} a été envoyé par email avec succès.`,
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["mail_log"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Impossible d'envoyer l'email : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!toEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir une adresse email.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Mail className="h-4 w-4 mr-2" />
          Envoyer par email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            Envoyer le {type === "quote" ? "devis" : "la facture"} par email
          </DialogTitle>
          <DialogDescription>
            Le PDF sera automatiquement joint à l'email.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email du destinataire</Label>
            <Input
              id="email"
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ajouter un message personnalisé..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sendEmailMutation.isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sendEmailMutation.isPending}>
            {sendEmailMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
