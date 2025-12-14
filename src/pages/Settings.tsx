import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Upload, Image as ImageIcon, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrgSettings {
  id?: string;
  org_id: string;
  company_name?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  brand_primary?: string;
  brand_secondary?: string;
  font?: string;
  header_bg_url?: string;
  footer_text?: string;
  email_from_address?: string;
  email_sender_name?: string;
  quote_prefix?: string;
  invoice_prefix?: string;
  default_vat_rate?: number;
  payment_terms_days?: number;
  quote_followup_days?: number;
  invoice_overdue_days?: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<OrgSettings>({
    org_id: crypto.randomUUID(),
    company_name: "",
    vat_number: "",
    address: "",
    phone: "",
    brand_primary: "#3b82f6",
    brand_secondary: "#1e40af",
    font: "Inter",
    header_bg_url: "",
    footer_text: "",
    email_from_address: "",
    email_sender_name: "",
    quote_prefix: "DEV-",
    invoice_prefix: "FACT-",
    default_vat_rate: 20,
    payment_terms_days: 30,
    quote_followup_days: 7,
    invoice_overdue_days: 15,
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
  });

  // Fetch org settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["orgSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: OrgSettings) => {
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from("org_settings")
          .update(data)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("org_settings")
          .insert([data]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgSettings"] });
      toast.success("Paramètres enregistrés avec succès");
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field: keyof OrgSettings, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${formData.org_id}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-assets")
        .getPublicUrl(filePath);

      // Update form data with new logo URL
      setFormData((prev) => ({ ...prev, header_bg_url: urlData.publicUrl }));
      toast.success("Logo uploadé avec succès");
    } catch (error: any) {
      console.error("Logo upload error:", error);
      toast.error("Erreur lors de l'upload du logo");
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, header_bg_url: "" }));
    toast.success("Logo supprimé");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-4">
            {/* Informations Entreprise */}
            <Card>
              <CardHeader>
                <CardTitle>Informations Entreprise</CardTitle>
                <CardDescription>
                  Vos informations d'entreprise apparaîtront sur les devis et factures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name || ""}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                      placeholder="Mon Entreprise"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vat_number">Numéro SIRET / TVA</Label>
                    <Input
                      id="vat_number"
                      value={formData.vat_number || ""}
                      onChange={(e) => handleChange("vat_number", e.target.value)}
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="123 Rue de l'Artisan, 75000 Paris"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="mt-4">
            {/* Branding */}
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de vos documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo de l'entreprise</Label>
                  <div className="flex items-start gap-4">
                    {formData.header_bg_url ? (
                      <div className="relative">
                        <img
                          src={formData.header_bg_url}
                          alt="Logo entreprise"
                          className="h-24 w-auto object-contain border rounded-lg p-2"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Upload en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {formData.header_bg_url ? "Changer le logo" : "Uploader un logo"}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG ou SVG. Taille max: 2 Mo. Recommandé: 300x100px
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand_primary">Couleur Principale</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brand_primary"
                        type="color"
                        value={formData.brand_primary || "#3b82f6"}
                        onChange={(e) => handleChange("brand_primary", e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.brand_primary || "#3b82f6"}
                        onChange={(e) => handleChange("brand_primary", e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand_secondary">Couleur Secondaire</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brand_secondary"
                        type="color"
                        value={formData.brand_secondary || "#1e40af"}
                        onChange={(e) => handleChange("brand_secondary", e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.brand_secondary || "#1e40af"}
                        onChange={(e) => handleChange("brand_secondary", e.target.value)}
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font">Police de caractères</Label>
                  <Input
                    id="font"
                    value={formData.font || "Inter"}
                    onChange={(e) => handleChange("font", e.target.value)}
                    placeholder="Inter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Pied de page (mentions légales)</Label>
                  <Textarea
                    id="footer_text"
                    value={formData.footer_text || ""}
                    onChange={(e) => handleChange("footer_text", e.target.value)}
                    placeholder="RCS Paris B 123 456 789 - Capital social : 10 000€"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            {/* Configuration Email */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Email</CardTitle>
                <CardDescription>
                  Paramètres d'envoi des emails (devis, factures, relances)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_from_address">Adresse email (visible)</Label>
                    <Input
                      id="email_from_address"
                      type="email"
                      value={formData.email_from_address || ""}
                      onChange={(e) => handleChange("email_from_address", e.target.value)}
                      placeholder="contact@monentreprise.fr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_sender_name">Nom de l'expéditeur</Label>
                    <Input
                      id="email_sender_name"
                      value={formData.email_sender_name || ""}
                      onChange={(e) => handleChange("email_sender_name", e.target.value)}
                      placeholder="Mon Entreprise"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Serveur SMTP (Optionnel)</h3>
                  <p className="text-sm text-muted-foreground">
                    Configurez votre propre serveur SMTP pour envoyer les emails depuis votre propre adresse.
                    Laissez vide pour utiliser le serveur par défaut.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">Serveur SMTP</Label>
                      <Input
                        id="smtp_host"
                        value={formData.smtp_host || ""}
                        onChange={(e) => handleChange("smtp_host", e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">Port SMTP</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={formData.smtp_port || 587}
                        onChange={(e) => handleChange("smtp_port", parseInt(e.target.value))}
                        placeholder="587"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_user">Utilisateur SMTP</Label>
                      <Input
                        id="smtp_user"
                        value={formData.smtp_user || ""}
                        onChange={(e) => handleChange("smtp_user", e.target.value)}
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">Mot de passe SMTP</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        value={formData.smtp_password || ""}
                        onChange={(e) => handleChange("smtp_password", e.target.value)}
                        placeholder="Votre mot de passe d'application"
                      />
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={() => toast.info("Fonctionnalité de test à venir")}>
                    Tester la connexion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            {/* Paramètres Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Documents</CardTitle>
                <CardDescription>
                  Configuration des devis et factures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quote_prefix">Préfixe devis</Label>
                    <Input
                      id="quote_prefix"
                      value={formData.quote_prefix || "DEV-"}
                      onChange={(e) => handleChange("quote_prefix", e.target.value)}
                      placeholder="DEV-"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoice_prefix">Préfixe facture</Label>
                    <Input
                      id="invoice_prefix"
                      value={formData.invoice_prefix || "FACT-"}
                      onChange={(e) => handleChange("invoice_prefix", e.target.value)}
                      placeholder="FACT-"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_vat_rate">TVA par défaut (%)</Label>
                    <Input
                      id="default_vat_rate"
                      type="number"
                      step="0.01"
                      value={formData.default_vat_rate || 20}
                      onChange={(e) => handleChange("default_vat_rate", parseFloat(e.target.value))}
                      placeholder="20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_terms_days">Délai de paiement (jours)</Label>
                    <Input
                      id="payment_terms_days"
                      type="number"
                      value={formData.payment_terms_days || 30}
                      onChange={(e) => handleChange("payment_terms_days", parseInt(e.target.value))}
                      placeholder="30"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quote_followup_days">
                      Relance devis non répondus (jours)
                    </Label>
                    <Input
                      id="quote_followup_days"
                      type="number"
                      value={formData.quote_followup_days || 7}
                      onChange={(e) => handleChange("quote_followup_days", parseInt(e.target.value))}
                      placeholder="7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoice_overdue_days">
                      Relance factures impayées (jours)
                    </Label>
                    <Input
                      id="invoice_overdue_days"
                      type="number"
                      value={formData.invoice_overdue_days || 15}
                      onChange={(e) => handleChange("invoice_overdue_days", parseInt(e.target.value))}
                      placeholder="15"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enregistrer les paramètres
          </Button>
        </div>
      </form>
    </div>
  );
}
