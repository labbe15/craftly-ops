import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Clock, AlertCircle, Send, CheckCircle } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function Reminders() {
  const queryClient = useQueryClient();
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // Fetch org settings to get reminder thresholds
  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch quotes that need follow-up
  const { data: quotes } = useQuery({
    queryKey: ["quotes-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          client:clients(name, email, contact_name)
        `)
        .in("status", ["sent"])
        .order("sent_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch overdue invoices
  const { data: invoices } = useQuery({
    queryKey: ["invoices-overdue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          client:clients(name, email, contact_name)
        `)
        .in("status", ["sent", "overdue"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch mail log for reminders history
  const { data: mailLog } = useQuery({
    queryKey: ["mail_log_reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mail_log")
        .select("*")
        .in("template_key", ["quote_reminder", "invoice_reminder"])
        .order("sent_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      email,
      number,
    }: {
      type: "quote" | "invoice";
      id: string;
      email: string;
      number: string;
    }) => {
      setSendingReminder(id);

      // Log the email in mail_log
      const { error } = await supabase.from("mail_log").insert({
        org_id: orgSettings?.org_id,
        to_email: email,
        subject: `Relance ${type === "quote" ? "devis" : "facture"} ${number}`,
        template_key: type === "quote" ? "quote_reminder" : "invoice_reminder",
        related_type: type,
        related_id: id,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      if (error) throw error;

      // In a real app, you would call your email service here
      // For now, we just log it in the database
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Relance envoyée pour ${variables.type === "quote" ? "le devis" : "la facture"} ${variables.number}`
      );
      queryClient.invalidateQueries({ queryKey: ["mail_log_reminders"] });
      setSendingReminder(null);
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'envoi : ${error.message}`);
      setSendingReminder(null);
    },
  });

  // Calculate quotes that need reminders
  const quotesNeedingReminder = quotes?.filter((quote) => {
    if (!quote.sent_at || !orgSettings?.quote_followup_days) return false;
    const daysSinceSent = differenceInDays(new Date(), new Date(quote.sent_at));
    return daysSinceSent >= orgSettings.quote_followup_days;
  });

  // Calculate invoices that need reminders
  const invoicesNeedingReminder = invoices?.filter((invoice) => {
    if (!invoice.due_date) return false;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);

    // Overdue invoices
    if (invoice.status === "overdue") return true;

    // Invoices approaching due date or overdue
    if (invoice.status === "sent") {
      const daysUntilDue = differenceInDays(dueDate, today);
      return daysUntilDue <= 0; // Already due or overdue
    }

    return false;
  });

  const stats = {
    quotesNeedingReminder: quotesNeedingReminder?.length || 0,
    invoicesNeedingReminder: invoicesNeedingReminder?.length || 0,
    totalRemindersSent: mailLog?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relances</h1>
          <p className="text-muted-foreground">
            Gérez les relances pour vos devis et factures
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Devis à relancer
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotesNeedingReminder}</div>
            <p className="text-xs text-muted-foreground">
              Après {orgSettings?.quote_followup_days || 7} jours sans réponse
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Factures à relancer
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoicesNeedingReminder}</div>
            <p className="text-xs text-muted-foreground">
              Échues ou en retard
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relances envoyées
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRemindersSent}</div>
            <p className="text-xs text-muted-foreground">
              Total historique
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Quotes and Invoices */}
      <Tabs defaultValue="quotes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotes">
            Devis ({stats.quotesNeedingReminder})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Factures ({stats.invoicesNeedingReminder})
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Devis nécessitant une relance</CardTitle>
              <CardDescription>
                Devis envoyés il y a plus de {orgSettings?.quote_followup_days || 7}{" "}
                jours sans réponse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotesNeedingReminder && quotesNeedingReminder.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Envoyé le</TableHead>
                      <TableHead>Jours écoulés</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotesNeedingReminder.map((quote) => {
                      const daysSinceSent = quote.sent_at
                        ? differenceInDays(new Date(), new Date(quote.sent_at))
                        : 0;
                      return (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">
                            {quote.number}
                          </TableCell>
                          <TableCell>
                            {quote.client?.name || "-"}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {quote.client?.email || "Pas d'email"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {quote.totals_ttc?.toFixed(2)} ¬
                          </TableCell>
                          <TableCell>
                            {quote.sent_at
                              ? format(new Date(quote.sent_at), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                daysSinceSent > 14 ? "destructive" : "secondary"
                              }
                            >
                              {daysSinceSent} jours
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!quote.client?.email) {
                                  toast.error("Le client n'a pas d'email");
                                  return;
                                }
                                sendReminderMutation.mutate({
                                  type: "quote",
                                  id: quote.id,
                                  email: quote.client.email,
                                  number: quote.number,
                                });
                              }}
                              disabled={
                                !quote.client?.email ||
                                sendingReminder === quote.id
                              }
                            >
                              {sendingReminder === quote.id ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Envoi...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Relancer
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Aucun devis ne nécessite de relance pour le moment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factures nécessitant une relance</CardTitle>
              <CardDescription>
                Factures échues ou en retard de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesNeedingReminder && invoicesNeedingReminder.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Retard</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesNeedingReminder.map((invoice) => {
                      const daysOverdue = invoice.due_date
                        ? Math.abs(
                            differenceInDays(
                              new Date(),
                              new Date(invoice.due_date)
                            )
                          )
                        : 0;
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.number}
                          </TableCell>
                          <TableCell>
                            {invoice.client?.name || "-"}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {invoice.client?.email || "Pas d'email"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {invoice.totals_ttc?.toFixed(2)} ¬
                          </TableCell>
                          <TableCell>
                            {invoice.due_date
                              ? format(new Date(invoice.due_date), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {daysOverdue} jour{daysOverdue > 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (!invoice.client?.email) {
                                  toast.error("Le client n'a pas d'email");
                                  return;
                                }
                                sendReminderMutation.mutate({
                                  type: "invoice",
                                  id: invoice.id,
                                  email: invoice.client.email,
                                  number: invoice.number,
                                });
                              }}
                              disabled={
                                !invoice.client?.email ||
                                sendingReminder === invoice.id
                              }
                            >
                              {sendingReminder === invoice.id ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Envoi...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Relancer
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Toutes les factures sont à jour !
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des relances</CardTitle>
              <CardDescription>
                Les 50 dernières relances envoyées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mailLog && mailLog.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mailLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.sent_at
                            ? format(
                                new Date(log.sent_at),
                                "dd/MM/yyyy HH:mm",
                                { locale: fr }
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.template_key === "quote_reminder"
                              ? "Devis"
                              : "Facture"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.to_email}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === "sent" ? "default" : "destructive"
                            }
                          >
                            {log.status || "unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Aucune relance envoyée pour le moment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
