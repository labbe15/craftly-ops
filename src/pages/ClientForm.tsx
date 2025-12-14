import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [type, setType] = useState<"professional" | "individual">("professional");
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
      setType(client.type || "professional");
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
    if (!siret.trim()) {
      toast.error("Veuillez saisir un numéro SIRET");
      return;
    }

    if (!isValidSiret(siret)) {
      toast.error("Le SIRET doit contenir 14 chiffres");
      return;
    }

    setSearchingPappers(true);

    try {
      const companyInfo = await searchBySiret(siret);

      // Auto-remplissage des champs
      setName(companyInfo.name);
      setAddress(companyInfo.address);
      setSiret(formatSiret(companyInfo.siret));
      if (companyInfo.vatNumber) setVatNumber(companyInfo.vatNumber);
      if (companyInfo.legalForm) setLegalForm(companyInfo.legalForm);
      if (companyInfo.registrationCity) setRegistrationCity(companyInfo.registrationCity);

      toast.success("Informations récupérées avec succès !");
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des données"
      );
    } finally {
      setSearchingPappers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!orgSettings?.org_id) {
        toast.error("Organisation non trouvée");
        return;
      }

      const data = {
        type,
        name,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        siret: type === "professional" ? siret || null : null,
        vat_number: type === "professional" ? vatNumber || null : null,
        legal_form: type === "professional" ? legalForm || null : null,
        registration_city: type === "professional" ? registrationCity || null : null,
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
            {/* Type Switch */}
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as "professional" | "individual")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional">Professionnel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Particulier</Label>
              </div>
            </RadioGroup>

            {/* SIRET Search Section - Only for Professionals */}
            {type === "professional" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="siret" className="text-blue-900 font-medium">
                    SIRET (auto-complétion)
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSearchBySiret}
                    disabled={searchingPappers || !siret.trim()}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {searchingPappers ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Rechercher
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  id="siret"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 01234 (14 chiffres)"
                  maxLength={17}
                  className="bg-white"
                />
                <p className="text-xs text-blue-700">
                  Saisissez un SIRET et cliquez sur "Rechercher" pour remplir
                  automatiquement les informations de l'entreprise
                </p>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {type === "professional"
                    ? "Nom de l'entreprise *"
                    : "Nom & Prénom *"}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={
                    type === "professional"
                      ? "Ex: Entreprise Dupont"
                      : "Ex: Jean Dupont"
                  }
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

            {/* Legal Information - Only for Professionals */}
            {type === "professional" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat_number">N° TVA</Label>
                  <Input
                    id="vat_number"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="FR12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_form">Forme juridique</Label>
                  <Input
                    id="legal_form"
                    value={legalForm}
                    onChange={(e) => setLegalForm(e.target.value)}
                    placeholder="SARL, SAS, EI..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_city">Ville RCS</Label>
                  <Input
                    id="registration_city"
                    value={registrationCity}
                    onChange={(e) => setRegistrationCity(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              </div>
            )}

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
