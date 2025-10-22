import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [clientId, setClientId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch event if editing
  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch quotes for dropdown
  const { data: quotes } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, number, client_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch invoices for dropdown
  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, number, client_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's org_id
  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("org_id")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setTitle(event.title || "");

      // Parse start_at
      const startDateTime = new Date(event.start_at);
      setStartDate(format(startDateTime, "yyyy-MM-dd"));
      setStartTime(format(startDateTime, "HH:mm"));

      // Parse end_at if exists
      if (event.end_at) {
        const endDateTime = new Date(event.end_at);
        setEndDate(format(endDateTime, "yyyy-MM-dd"));
        setEndTime(format(endDateTime, "HH:mm"));
      }

      setClientId(event.client_id || "");
      setQuoteId(event.quote_id || "");
      setInvoiceId(event.invoice_id || "");
      setNotes(event.notes || "");
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!orgSettings?.org_id) {
        toast.error("Organisation non trouvée");
        return;
      }

      // Combine date and time for start_at
      const start_at = `${startDate}T${startTime}:00`;

      // Combine date and time for end_at if provided
      let end_at = null;
      if (endDate && endTime) {
        end_at = `${endDate}T${endTime}:00`;
      }

      const data = {
        title,
        start_at,
        end_at,
        client_id: clientId || null,
        quote_id: quoteId || null,
        invoice_id: invoiceId || null,
        notes: notes || null,
        org_id: orgSettings.org_id,
      };

      if (id) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update(data)
          .eq("id", id);

        if (error) throw error;
        toast.success("Événement mis à jour avec succès");
      } else {
        // Create new event
        const { error } = await supabase.from("events").insert(data);

        if (error) throw error;
        toast.success("Événement créé avec succès");
      }

      navigate("/agenda");
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Erreur lors de ${id ? "la mise à jour" : "la création"} de l'événement`
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter quotes and invoices by selected client
  const filteredQuotes = quotes?.filter(
    (q) => !clientId || q.client_id === clientId
  );
  const filteredInvoices = invoices?.filter(
    (i) => !clientId || i.client_id === clientId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agenda")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {id ? "Modifier l'événement" : "Nouvel événement"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'événement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'événement *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex: Rendez-vous client, Installation, ..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Heure de début *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Heure de fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun client</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote_id">Devis lié</Label>
                <Select value={quoteId} onValueChange={setQuoteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un devis (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun devis</SelectItem>
                    {filteredQuotes?.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_id">Facture liée</Label>
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une facture (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune facture</SelectItem>
                    {filteredInvoices?.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Détails de l'événement, adresse, remarques..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/agenda")}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading
                  ? id
                    ? "Enregistrement..."
                    : "Création..."
                  : id
                  ? "Enregistrer"
                  : "Créer l'événement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
