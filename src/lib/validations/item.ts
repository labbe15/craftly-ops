import { z } from "zod";

export const itemSchema = z.object({
  name: z.string().min(1, "Le nom de l'article est requis").max(200, "Le nom est trop long"),
  description: z.string().max(1000, "Description trop longue").optional().nullable().or(z.literal("")),
  unit_price_ht: z.coerce.number().min(0, "Le prix doit être positif").max(999999.99, "Prix trop élevé"),
  vat_rate: z.coerce.number().min(0, "Le taux de TVA doit être positif").max(100, "Le taux de TVA ne peut pas dépasser 100%"),
  unit: z.string().min(1, "L'unité est requise").max(10, "Unité trop longue"),
});

export type ItemFormData = z.infer<typeof itemSchema>;

export const itemFormDefaults: ItemFormData = {
  name: "",
  description: "",
  unit_price_ht: 0,
  vat_rate: 20,
  unit: "u",
};
