import { toast } from "sonner";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown, context?: string): void {
  console.error(`Error in ${context || "application"}:`, error);

  if (error instanceof AppError) {
    toast.error(error.message);
    return;
  }

  if (error instanceof Error) {
    // Erreurs Supabase
    if ('code' in error && 'message' in error) {
      const supabaseError = error as { code: string; message: string };

      switch (supabaseError.code) {
        case 'PGRST116':
          toast.error("Aucune donnée trouvée");
          break;
        case '23505':
          toast.error("Cette donnée existe déjà");
          break;
        case '23503':
          toast.error("Impossible de supprimer : données liées existantes");
          break;
        default:
          toast.error(supabaseError.message || "Une erreur est survenue");
      }
      return;
    }

    toast.error(error.message || "Une erreur inattendue est survenue");
    return;
  }

  toast.error("Une erreur inattendue est survenue");
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("fetch") ||
           error.message.includes("network") ||
           error.message.includes("NetworkError");
  }
  return false;
}
