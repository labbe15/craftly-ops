import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

interface AddPaymentDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  remainingAmount: number;
  disabled?: boolean;
}

export function AddPaymentDialog({
  invoiceId,
  invoiceNumber,
  remainingAmount,
  disabled,
}: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remainingAmount.toFixed(2));
  const [method, setMethod] = useState("virement");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const paymentAmount = parseFloat(amount);

      if (paymentAmount <= 0 || paymentAmount > remainingAmount) {
        throw new Error("Montant invalide");
      }

      const paymentData: TablesInsert<"payments"> = {
        invoice_id: invoiceId,
        amount: paymentAmount,
        method,
        note: note || null,
        paid_at: new Date(paidAt).toISOString(),
      };

      const { error } = await supabase
        .from("payments")
        .insert(paymentData);

      if (error) throw error;

      // Check if invoice is fully paid
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", invoiceId);

      const totalPaid = (payments || []).reduce(
        (sum, p) => sum + p.amount,
        paymentAmount
      );

      const { data: invoice } = await supabase
        .from("invoices")
        .select("totals_ttc")
        .eq("id", invoiceId)
        .single();

      if (invoice && totalPaid >= invoice.totals_ttc) {
        // Mark invoice as paid
        await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);
      }
    },
    onSuccess: () => {
      toast({
        title: "Paiement ajouté",
        description: "Le paiement a été enregistré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["payments", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpen(false);
      // Reset form
      setAmount(remainingAmount.toFixed(2));
      setMethod("virement");
      setNote("");
      setPaidAt(new Date().toISOString().split("T")[0]);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter le paiement : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPaymentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled || remainingAmount <= 0}>
          <CreditCard className="h-4 w-4 mr-2" />
          Ajouter un paiement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
            <DialogDescription>
              Facture {invoiceNumber} - Restant à payer: {remainingAmount.toFixed(2)} €
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="method">Moyen de paiement *</Label>
              <Select value={method} onValueChange={setMethod} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="prelevement">Prélèvement</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paid_at">Date de paiement *</Label>
              <Input
                id="paid_at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note (optionnelle)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addPaymentMutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={addPaymentMutation.isPending}>
              {addPaymentMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
