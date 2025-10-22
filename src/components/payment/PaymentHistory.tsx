import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreditCard, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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

interface PaymentHistoryProps {
  invoiceId: string;
  invoiceTotalTTC: number;
}

export function PaymentHistory({
  invoiceId,
  invoiceTotalTTC,
}: PaymentHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("paid_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      // Update invoice status if needed
      const { data: remainingPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", invoiceId)
        .neq("id", paymentId);

      const totalPaid = (remainingPayments || []).reduce(
        (sum, p) => sum + p.amount,
        0
      );

      if (totalPaid < invoiceTotalTTC) {
        // Mark invoice as sent if it was paid
        await supabase
          .from("invoices")
          .update({
            status: "sent",
            paid_at: null,
          })
          .eq("id", invoiceId);
      }
    },
    onSuccess: () => {
      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["payments", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le paiement : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = invoiceTotalTTC - totalPaid;

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      virement: "Virement bancaire",
      cheque: "Chèque",
      especes: "Espèces",
      carte: "Carte bancaire",
      prelevement: "Prélèvement",
      autre: "Autre",
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Historique des paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Historique des paiements
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total payé: </span>
              <span className="font-semibold">{totalPaid.toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-muted-foreground">Restant: </span>
              <span className="font-semibold text-orange-600">
                {remaining.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!payments || payments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun paiement enregistré
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Moyen</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.paid_at
                      ? format(new Date(payment.paid_at), "dd MMMM yyyy", {
                          locale: fr,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {payment.amount.toFixed(2)} €
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPaymentMethodLabel(payment.method || "")}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {payment.note || "-"}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletePaymentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Supprimer le paiement
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce paiement de{" "}
                            {payment.amount.toFixed(2)} € ? Cette action est
                            irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deletePaymentMutation.mutate(payment.id)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
