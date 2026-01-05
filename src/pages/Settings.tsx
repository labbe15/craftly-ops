import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Ici c'est safe car Loader2 est rarement buggé
// Si tu as peur des icônes, remplace Loader2 par un simple texte "..."

interface OrgSettings {
  id: string;
  org_id: string;
  company_name: string;
  siret: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  terms_text: string | null;
  vat_active: boolean; // Futur champ TVA
  vat_rate: number;    // Futur champ TVA
}

export default function Settings() {
  const queryClient = useQueryClient();
  
  // États locaux pour le formulaire
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vatActive, setVatActive] = useState(false);

  // 1. Récupération optimisée des réglages
  const { data: settings, isLoading } = useQuery({
    queryKey: ["org_settings"], // CLÉ UNIFIÉE : Partage le cache avec les autres pages
    staleTime: 1000 * 60 * 5,   // 5 minutes sans recharger (Navigation instantanée)
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*") // On prend tout, c'est une seule ligne, c'est léger
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as OrgSettings;
    },
  });

  // 2. Synchronisation des données quand elles arrivent
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || "");
      setSiret(settings.siret || "");
      setAddress(settings.address || "");
      setEmail(settings.email || "");
      setPhone(settings.phone || "");
      setVatActive(settings.vat_active || false);
    }
  }, [settings]);

  // 3. Mutation de sauvegarde
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("Impossible de trouver l'ID des réglages");

      const { error } = await supabase
        .from("org_settings")
        .update({
          company_name: companyName,
          siret: siret,
          address: address,
          email: email,
          phone: phone,
          vat_active: vatActive, // Prêt pour la TVA
        })
        .eq("id", settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paramètres enregistrés");
      // On met à jour le cache immédiatement sans recharger la page
      queryClient.invalidateQueries({ queryKey: ["org_settings"] });
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Paramètres de l'entreprise</h1>
        <p className="text-muted-foreground">
          Gérez les informations légales et les préférences de votre société.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Carte Identité */}
        <Card>
          <CardHeader>
            <CardTitle>Identité & Coordonnées</CardTitle>
            <CardDescription>Ces informations apparaîtront sur vos devis et factures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de la société</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SIRET</Label>
                <Input value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="000 000 000 00000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse complète</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 rue des Artisans, 75000 Paris" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email de contact</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte TVA & Facturation (Préparation) */}
        <Card>
          <CardHeader>
            <CardTitle>Facturation & TVA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Assujetti à la TVA</Label>
                <p className="text-sm text-muted-foreground">
                  Activez cette option si vous dépassez les seuils ou par choix.
                </p>
              </div>
              <Switch checked={vatActive} onCheckedChange={setVatActive} />
            </div>
          </CardContent>
        </Card>

        {/* Bouton Sauvegarder Flottant ou Fixe */}
        <div className="flex justify-end">
          <Button 
            size="lg" 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}
