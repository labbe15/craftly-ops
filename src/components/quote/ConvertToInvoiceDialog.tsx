import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { convertQuoteToInvoice } from "@/services/quoteToInvoiceService";

interface ConvertToInvoiceDialogProps {
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
  disabled?: boolean;
}

export function ConvertToInvoiceDialog({
  quoteId,
  quoteNumber,
  quoteStatus,
  disabled,
}: ConvertToInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: () => convertQuoteToInvoice(quoteId),
    onSuccess: (invoiceId) => {
      toast({
        title: "Conversion réussie",
        description: `Le devis ${quoteNumber} a été converti en facture avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      setOpen(false);

      // Navigate to the new invoice
      navigate(`/invoices/${invoiceId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Impossible de convertir le devis : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleConvert = () => {
    convertMutation.mutate();
  };

  // Only show button if quote is accepted
  if (quoteStatus !== "accepted") {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled}>
          <FileText className="h-4 w-4 mr-2" />
          Convertir en facture
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Convertir en facture</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va créer une nouvelle facture basée sur le devis{" "}
            <strong>{quoteNumber}</strong>.
            <br />
            <br />
            La facture sera créée avec :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tous les articles du devis</li>
              <li>Le même client</li>
              <li>Les mêmes montants</li>
              <li>Un lien vers le devis d'origine</li>
            </ul>
            <br />
            Vous serez redirigé vers la nouvelle facture après la conversion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={convertMutation.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConvert();
            }}
            disabled={convertMutation.isPending}
          >
            {convertMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Convertir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
