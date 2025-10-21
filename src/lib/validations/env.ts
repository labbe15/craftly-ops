import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL doit être une URL valide"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "VITE_SUPABASE_PUBLISHABLE_KEY est requis"),
  VITE_SUPABASE_PROJECT_ID: z.string().min(1, "VITE_SUPABASE_PROJECT_ID est requis").optional(),
});

export function validateEnv() {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    });
  } catch (error) {
    console.error("❌ Variables d'environnement invalides:", error);
    throw new Error("Configuration Supabase manquante. Vérifiez votre fichier .env");
  }
}

export type Env = z.infer<typeof envSchema>;
