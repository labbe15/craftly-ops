import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrgId } from "@/hooks/useOrgId";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { orgId, isLoading: isLoadingOrgId } = useOrgId();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["org_settings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .eq("org_id", orgId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!orgId) throw new Error("Organization ID not found");

      const data = {
        org_id: orgId,
        company_name: formData.get("company_name") as string,
        vat_number: formData.get("vat_number") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        brand_primary: formData.get("brand_primary") as string,
        brand_secondary: formData.get("brand_secondary") as string,
        header_bg_url: formData.get("header_bg_url") as string,
        footer_text: formData.get("footer_text") as string,
        quote_prefix: formData.get("quote_prefix") as string,
        invoice_prefix: formData.get("invoice_prefix") as string,
        default_vat_rate: parseFloat(formData.get("default_vat_rate") as string),
        payment_terms_days: parseInt(formData.get("payment_terms_days") as string),
      };

      if (settings?.id) {
        // Update
        const { error } = await supabase
          .from("org_settings")
          .update(data)
          .eq("org_id", orgId);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("org_settings").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_settings", orgId] });
      toast.success("Paramètres enregistrés avec succès");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate(formData);
  };

  if (isLoadingOrgId || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Personnalisez votre CRM et vos documents (devis, factures)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de l'entreprise */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>
              Ces informations apparaîtront sur vos devis et factures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={settings?.company_name || ""}
                  placeholder="Votre Entreprise SARL"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">N° SIRET / TVA</Label>
                <Input
                  id="vat_number"
                  name="vat_number"
                  defaultValue={settings?.vat_number || ""}
                  placeholder="123 456 789 00012"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={settings?.address || ""}
                placeholder="123 Rue de la République&#10;75001 Paris"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={settings?.phone || ""}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personnalisation visuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation visuelle</CardTitle>
            <CardDescription>
              Personnalisez l'apparence de vos documents PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand_primary">Couleur principale</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_primary"
                    name="brand_primary"
                    type="color"
                    defaultValue={settings?.brand_primary || "#3b82f6"}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    defaultValue={settings?.brand_primary || "#3b82f6"}
                    placeholder="#3b82f6"
                    disabled
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisée pour les en-têtes de devis
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_secondary">Couleur secondaire</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_secondary"
                    name="brand_secondary"
                    type="color"
                    defaultValue={settings?.brand_secondary || "#dc2626"}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    defaultValue={settings?.brand_secondary || "#dc2626"}
                    placeholder="#dc2626"
                    disabled
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisée pour les en-têtes de factures
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header_bg_url">URL du logo (optionnel)</Label>
              <Input
                id="header_bg_url"
                name="header_bg_url"
                defaultValue={settings?.header_bg_url || ""}
                placeholder="https://exemple.com/logo.png"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Entrez l'URL d'un logo hébergé en ligne (PNG, JPG)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Numérotation */}
        <Card>
          <CardHeader>
            <CardTitle>Numérotation des documents</CardTitle>
            <CardDescription>Préfixes pour vos devis et factures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote_prefix">Préfixe des devis</Label>
                <Input
                  id="quote_prefix"
                  name="quote_prefix"
                  defaultValue={settings?.quote_prefix || "DEV-"}
                  placeholder="DEV-"
                />
                <p className="text-xs text-muted-foreground">Exemple : DEV-2025-001</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Préfixe des factures</Label>
                <Input
                  id="invoice_prefix"
                  name="invoice_prefix"
                  defaultValue={settings?.invoice_prefix || "FACT-"}
                  placeholder="FACT-"
                />
                <p className="text-xs text-muted-foreground">Exemple : FACT-2025-001</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres par défaut */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres par défaut</CardTitle>
            <CardDescription>Valeurs utilisées par défaut lors de la création</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_vat_rate">Taux de TVA par défaut (%)</Label>
                <Input
                  id="default_vat_rate"
                  name="default_vat_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings?.default_vat_rate || 20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms_days">Délai de paiement (jours)</Label>
                <Input
                  id="payment_terms_days"
                  name="payment_terms_days"
                  type="number"
                  min="0"
                  defaultValue={settings?.payment_terms_days || 30}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_text">Texte pied de page</Label>
              <Textarea
                id="footer_text"
                name="footer_text"
                defaultValue={
                  settings?.footer_text ||
                  "TVA non applicable selon l'article 293 B du CGI. En cas de retard de paiement, indemnité forfaitaire de 40€."
                }
                placeholder="Mentions légales, conditions..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Affiché en bas de vos devis et factures
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
