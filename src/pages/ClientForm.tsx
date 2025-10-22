import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch client if editing
  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
    if (client) {
      setName(client.name || "");
      setContactName(client.contact_name || "");
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setAddress(client.address || "");
      setNotes(client.notes || "");
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!orgSettings?.org_id) {
        toast.error("Organisation non trouvée");
        return;
      }

      const data = {
        name,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        org_id: orgSettings.org_id,
      };

      if (id) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update(data)
          .eq("id", id);

        if (error) throw error;
        toast.success("Client mis à jour avec succès");
      } else {
        // Create new client
        const { error } = await supabase.from("clients").insert(data);

        if (error) throw error;
        toast.success("Client créé avec succès");
      }

      navigate("/clients");
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Erreur lors de ${id ? "la mise à jour" : "la création"} du client`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {id ? "Modifier le client" : "Nouveau client"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Entreprise Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nom du contact</Label>
                <Input
                  id="contact_name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Adresse complète du client..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Notes internes sur le client..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clients")}
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
                  : "Créer le client"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
