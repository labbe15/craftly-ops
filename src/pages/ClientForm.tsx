import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useOrgId } from "@/hooks/useOrgId";
import { useQuery } from "@tanstack/react-query";

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const { orgId, isLoading: isLoadingOrgId } = useOrgId();

  const isEditMode = !!id;

  // Fetch client data if in edit mode
  const { data: client, isLoading: isLoadingClient } = useQuery({
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!orgId) {
      toast.error("Organisation non trouvée");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contact_name: formData.get("contact_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
      org_id: orgId,
    };

    let error;
    if (isEditMode && id) {
      const result = await supabase.from("clients").update(data).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from("clients").insert(data);
      error = result.error;
    }

    if (error) {
      toast.error(`Erreur lors de ${isEditMode ? "la modification" : "la création"} du client`);
      console.error(error);
    } else {
      toast.success(`Client ${isEditMode ? "modifié" : "créé"} avec succès`);
      navigate("/clients");
    }

    setLoading(false);
  };

  if (isLoadingOrgId || isLoadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? "Modifier le client" : "Nouveau client"}</h1>
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
                <Input id="name" name="name" required defaultValue={client?.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nom du contact</Label>
                <Input id="contact_name" name="contact_name" defaultValue={client?.contact_name || ""} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={client?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" defaultValue={client?.phone || ""} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea id="address" name="address" rows={3} defaultValue={client?.address || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={4} defaultValue={client?.notes || ""} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/clients")}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditMode ? "Modification..." : "Création...") : (isEditMode ? "Modifier le client" : "Créer le client")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
