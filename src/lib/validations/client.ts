import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est requis").max(100, "Le nom est trop long"),
  contact_name: z.string().max(100, "Le nom du contact est trop long").optional().nullable(),
  email: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  phone: z.string().max(20, "Numéro de téléphone trop long").optional().nullable().or(z.literal("")),
  address: z.string().max(500, "Adresse trop longue").optional().nullable().or(z.literal("")),
  notes: z.string().max(2000, "Notes trop longues").optional().nullable().or(z.literal("")),
  tags: z.string().max(200, "Tags trop longs").optional().nullable().or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const clientFormDefaults: ClientFormData = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  tags: "",
};
