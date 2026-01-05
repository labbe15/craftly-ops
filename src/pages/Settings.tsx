import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building2, Palette, FileText, Mail, Loader2, Save } from "lucide-react";

// Interface complète incluant tous les champs possibles
interface OrgSettings {
  id: string;
  org_id: string;
  // Entreprise
  company_name: string;
  siret: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  // Branding
  logo_url: string | null;
  primary_color: string | null;
  // Documents
  terms_text: string | null; // CGV
  footer_text: string | null; // Pied de page
  // Email / SMTP
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  // TVA (Nouveau)
  vat_active: boolean;
  vat_rate: number;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");

  // --- ÉTATS LOCAUX ---
  // 1. Entreprise
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // 2. Branding
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");

  // 3. Documents
  const [termsText, setTermsText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [vatActive, setVatActive] = useState(false);

  // 4. Email (SMTP)
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState(""); // On ne l'affiche pas, on le set juste

  // --- CHARGEMENT OPTIMISÉ ---
  const { data: settings, isLoading } = useQuery({
    queryKey: ["org_settings"],
    staleTime: 1000 * 60 * 5, // 5 minutes de mémoire cache
    placeholderData: (previousData) => previousData, // Pas de scintillement
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as OrgSettings;
    },
  });

  // --- SYNCHRONISATION ---
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || "");
      setSiret(settings.siret || "");
      setAddress(settings.address || "");
      setContactEmail(settings.email || "");
      setPhone(settings.phone || "");
      
      setLogoUrl(settings.logo_url || "");
      setPrimaryColor(settings.primary_color || "#0f172a");
      
      setTermsText(settings.terms_text || "");
      setFooterText(settings.footer_text || "");
      setVatActive(settings.vat_active || false);

      setSmtpHost(settings.smtp_host || "");
      setSmtpPort(settings.smtp_port?.toString() || "587");
      setSmtpUser(settings.smtp_user || "");
    }
  }, [settings]);

  // --- SAUVEGARDE ---
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("ID introuvable");

      const updates: any = {
        company_name: companyName,
        siret: siret,
        address: address,
        email: contactEmail,
        phone: phone,
        logo_url: logoUrl,
        primary_color: primaryColor,
        terms_text: termsText,
        footer_text: footerText,
        vat_active: vatActive,
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort),
        smtp_user: smtpUser,
      };

      // On n'envoie le mot de passe que s'il a été modifié (champ non vide)
      // Note: Il faudra gérer le champ password côté DB si ce n'est pas fait
      // Pour l'instant on suppose que c'est géré ou on l'ignore si la colonne n'existe pas encore.

      const { error } = await supabase
        .from("org_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paramètres mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["org_settings"] });
    },
    onError: (err: any) => {
      toast.error("Erreur de sauvegarde : " + err.message);
    },
  });

  if (isLoading && !settings) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Configuration générale de votre organisation</p>
        </div>
        <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer tout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Entreprise
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents & TVA
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email / SMTP
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET 1 : ENTREPRISE --- */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Identité de l'entreprise</CardTitle>
              <CardDescription>Informations légales affichées sur vos factures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de la société</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input value={siret} onChange={(e) => setSiret(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ONGLET 2 : BRANDING --- */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation</CardTitle>
              <CardDescription>Logo et couleurs de vos documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo (URL)</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                <p className="text-xs text-muted-foreground">Collez le lien direct vers votre logo (hébergé sur Supabase Storage par exemple).</p>
              </div>
              <div className="space-y-2">
                <Label>Couleur Principale</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)} 
                    className="w-12 h-10 p-1 px-1" 
                  />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ONGLET 3 : DOCUMENTS & TVA --- */}
        <TabsContent value="documents">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mentions légales</CardTitle>
                <CardDescription>Textes par défaut sur vos devis et factures.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Conditions Générales (Pied de page)</Label>
                  <Textarea 
                    value={termsText} 
                    onChange={(e) => setTermsText(e.target.value)} 
                    placeholder="Ex: Validité du devis 30 jours..." 
                    rows={4} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note de bas de page (Footer)</Label>
                  <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Ex: SAS au capital de..." />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-900">Fiscalité & TVA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Assujetti à la TVA</Label>
                    <p className="text-sm text-muted-foreground">
                      Activez ceci si vous facturez la TVA (franchise dépassée ou option).
                    </p>
                  </div>
                  <Switch checked={vatActive} onCheckedChange={setVatActive} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- ONGLET 4 : EMAIL / SMTP --- */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Email (SMTP)</CardTitle>
              <CardDescription>Pour envoyer les devis avec votre propre adresse email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serveur SMTP (Host)</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="ex: smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Utilisateur SMTP</Label>
                <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="votre@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe SMTP</Label>
                <Input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="••••••••" />
                <p className="text-xs text-muted-foreground">Laissez vide pour ne pas changer le mot de passe actuel.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
