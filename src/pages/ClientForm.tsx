import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import ajouté
import { ArrowLeft, Save, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchBySiret, isValidSiret, formatSiret } from "@/services/pappers.service";

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [searchingPappers, setSearchingPappers] = useState(false);

  // Form state
  const [type, setType] = useState<"professional" | "individual">("professional"); // Nouveau
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [siret, setSiret] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [registrationCity, setRegistrationCity] = useState("");

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings").select("org_id").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (client) {
      setType(client.type || "professional"); // Charge le type
      setName(client.name || "");
      setContactName(client.contact_name || "");
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setAddress(client.address || "");
      setNotes(client.notes || "");
      setSiret(client.siret || "");
      setVatNumber(client.vat_number || "");
      setLegalForm(client.legal_form || "");
      setRegistrationCity(client.registration_city || "");
    }
  }, [client]);

  const handleSearchBySiret = async () => {
    if (!siret.trim() || !isValidSiret(siret)) {
      toast.error("SIRET invalide");
      return;
    }
    setSearchingPappers(true);
    try {
      const info = await searchBySiret(siret);
      setName(info.name);
      setAddress(info.address);
      setSiret(formatSiret(info.siret));
      if (info.vatNumber) setVatNumber(info.vatNumber);
      if (info.legalForm) setLegalForm(info.legalForm);
      if (info.registrationCity) setRegistrationCity(info.registrationCity);
      toast.success("Données récupérées !");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSearchingPappers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!orgSettings?.org_id) throw new Error("Org ID manquant");

      const data = {
        type, // Sauvegarde du type
        name,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        siret: type === "professional" ? siret : null, // Pas de SIRET si particulier
        vat_number: type === "professional" ? vatNumber : null,
        legal_form: type === "professional" ? legalForm : null,
        registration_city: type === "professional" ? registrationCity : null,
        org_id: orgSettings.org_id,
      };

      if (id) {
        await supabase.from("clients").update(data).eq("id", id);
        toast.success("Client modifié");
      } else {
        await supabase.from("clients").insert(data);
        toast.success("Client créé");
      }
      navigate("/clients");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-3xl font-bold">{id ? "Modifier" : "Nouveau"} client</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type Switcher */}
            <div className="flex justify-center pb-4">
                <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="flex space-x-4">
                    <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 data-[state=checked]:border-primary">
                        <RadioGroupItem value="professional" id="r-pro" />
                        <Label htmlFor="r-pro" className="cursor-pointer font-medium">Professionnel</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="individual" id="r-ind" />
                        <Label htmlFor="r-ind" className="cursor-pointer font-medium">Particulier</Label>
                    </div>
                </RadioGroup>
            </div>

            {/* SIRET Section (Only for Pros) */}
            {type === "professional" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="siret" className="text-blue-900 font-medium">SIRET (Recherche auto)</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleSearchBySiret} disabled={searchingPappers || !siret.trim()} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    {searchingPappers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Rechercher
                    </Button>
                </div>
                <Input id="siret" value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="14 chiffres" className="bg-white" />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{type === "professional" ? "Nom de l'entreprise *" : "Nom & Prénom *"}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">{type === "professional" ? "Contact principal" : "Surnom / Autre"}</Label>
                <Input id="contact_name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
            </div>

            {/* Legal Info (Only for Pros) */}
            {type === "professional" && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="space-y-2">
                    <Label htmlFor="vat_number">N° TVA</Label>
                    <Input id="vat_number" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="legal_form">Forme juridique</Label>
                    <Input id="legal_form" value={legalForm} onChange={(e) => setLegalForm(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="registration_city">Ville RCS</Label>
                    <Input id="registration_city" value={registrationCity} onChange={(e) => setRegistrationCity(e.target.value)} />
                </div>
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/clients")}>Annuler</Button>
              <Button type="submit" disabled={loading}><Save className="h-4 w-4 mr-2" />Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
