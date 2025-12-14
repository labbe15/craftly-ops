import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ClientDialogFormProps {
  onClientCreated: (clientId: string) => void;
  orgId?: string;
}

export function ClientDialogForm({ onClientCreated, orgId }: ClientDialogFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"professional" | "individual">("professional");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("Organisation manquante");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          org_id: orgId,
          type,
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Client créé avec succès");
      onClientCreated(data.id);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la création du client");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType("professional");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" type="button">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup
            value={type}
            onValueChange={(v) => setType(v as "professional" | "individual")}
            className="flex space-x-4 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="professional" id="d-professional" />
              <Label htmlFor="d-professional">Professionnel</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="d-individual" />
              <Label htmlFor="d-individual">Particulier</Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="d-name">
              {type === "professional" ? "Nom de l'entreprise *" : "Nom & Prénom *"}
            </Label>
            <Input
              id="d-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={
                type === "professional" ? "Ex: ACME Corp" : "Ex: Jean Dupont"
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-email">Email</Label>
            <Input
              id="d-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@exemple.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-phone">Téléphone</Label>
            <Input
              id="d-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>

           <div className="space-y-2">
            <Label htmlFor="d-address">Adresse</Label>
            <Input
              id="d-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1 rue de la Paix, 75000 Paris"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
