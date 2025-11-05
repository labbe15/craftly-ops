/**
 * Service pour l'intégration de l'API Pappers
 * Documentation API : https://www.pappers.fr/api/documentation
 */

const PAPPERS_API_BASE_URL = "https://api.pappers.fr/v2";
const PAPPERS_API_KEY = import.meta.env.VITE_PAPPERS_API_KEY;

export interface PappersCompanyData {
  siret: string;
  siren: string;
  nom_entreprise: string;
  nom_complet?: string;
  siege: {
    siret: string;
    adresse_ligne_1?: string;
    adresse_ligne_2?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
    latitude?: number;
    longitude?: number;
  };
  forme_juridique?: string;
  forme_juridique_code?: string;
  numero_tva_intracommunautaire?: string;
  ville_immatriculation?: string;
  categorie_juridique?: string;
  date_creation?: string;
  date_radiation?: string;
  statut_rcs?: string;
  capital?: number;
  capital_formate?: string;
  objet_social?: string;
}

export interface PappersSearchResult {
  resultats_siren: Array<{
    siren: string;
    nom_entreprise: string;
    siege: {
      siret: string;
      code_postal?: string;
      ville?: string;
    };
  }>;
  resultats_siret: Array<{
    siret: string;
    siren: string;
    nom_entreprise: string;
    siege: {
      code_postal?: string;
      ville?: string;
    };
  }>;
}

export interface CompanyInfo {
  siret: string;
  name: string;
  address: string;
  vatNumber?: string;
  legalForm?: string;
  registrationCity?: string;
}

/**
 * Recherche une entreprise par SIRET
 * @param siret - Numéro SIRET (14 chiffres)
 * @returns Informations de l'entreprise
 */
export async function searchBySiret(siret: string): Promise<CompanyInfo> {
  if (!PAPPERS_API_KEY) {
    throw new Error(
      "Clé API Pappers non configurée. Veuillez ajouter VITE_PAPPERS_API_KEY dans votre fichier .env"
    );
  }

  // Nettoyage du SIRET (suppression des espaces et caractères spéciaux)
  const cleanSiret = siret.replace(/\s/g, "").replace(/[^0-9]/g, "");

  if (cleanSiret.length !== 14) {
    throw new Error("Le SIRET doit contenir exactement 14 chiffres");
  }

  const url = `${PAPPERS_API_BASE_URL}/entreprise?api_token=${PAPPERS_API_KEY}&siret=${cleanSiret}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Aucune entreprise trouvée avec ce SIRET");
      }
      if (response.status === 401) {
        throw new Error("Clé API Pappers invalide");
      }
      if (response.status === 429) {
        throw new Error("Limite de requêtes API dépassée. Veuillez réessayer plus tard.");
      }
      throw new Error(`Erreur API Pappers : ${response.status}`);
    }

    const data: PappersCompanyData = await response.json();

    return formatCompanyData(data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de la récupération des données de l'entreprise");
  }
}

/**
 * Recherche une entreprise par SIREN
 * @param siren - Numéro SIREN (9 chiffres)
 * @returns Informations de l'entreprise
 */
export async function searchBySiren(siren: string): Promise<CompanyInfo> {
  if (!PAPPERS_API_KEY) {
    throw new Error(
      "Clé API Pappers non configurée. Veuillez ajouter VITE_PAPPERS_API_KEY dans votre fichier .env"
    );
  }

  // Nettoyage du SIREN
  const cleanSiren = siren.replace(/\s/g, "").replace(/[^0-9]/g, "");

  if (cleanSiren.length !== 9) {
    throw new Error("Le SIREN doit contenir exactement 9 chiffres");
  }

  const url = `${PAPPERS_API_BASE_URL}/entreprise?api_token=${PAPPERS_API_KEY}&siren=${cleanSiren}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Aucune entreprise trouvée avec ce SIREN");
      }
      if (response.status === 401) {
        throw new Error("Clé API Pappers invalide");
      }
      if (response.status === 429) {
        throw new Error("Limite de requêtes API dépassée. Veuillez réessayer plus tard.");
      }
      throw new Error(`Erreur API Pappers : ${response.status}`);
    }

    const data: PappersCompanyData = await response.json();

    return formatCompanyData(data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de la récupération des données de l'entreprise");
  }
}

/**
 * Recherche des entreprises par nom
 * @param query - Nom de l'entreprise à rechercher
 * @param maxResults - Nombre maximum de résultats (défaut: 10)
 * @returns Liste des entreprises trouvées
 */
export async function searchByName(
  query: string,
  maxResults: number = 10
): Promise<PappersSearchResult> {
  if (!PAPPERS_API_KEY) {
    throw new Error(
      "Clé API Pappers non configurée. Veuillez ajouter VITE_PAPPERS_API_KEY dans votre fichier .env"
    );
  }

  if (!query || query.trim().length < 2) {
    throw new Error("La recherche doit contenir au moins 2 caractères");
  }

  const url = `${PAPPERS_API_BASE_URL}/recherche?api_token=${PAPPERS_API_KEY}&q=${encodeURIComponent(
    query
  )}&longueur=${maxResults}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Clé API Pappers invalide");
      }
      if (response.status === 429) {
        throw new Error("Limite de requêtes API dépassée. Veuillez réessayer plus tard.");
      }
      throw new Error(`Erreur API Pappers : ${response.status}`);
    }

    const data: PappersSearchResult = await response.json();

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de la recherche d'entreprises");
  }
}

/**
 * Formate les données de l'API Pappers en format interne
 * @param data - Données brutes de l'API Pappers
 * @returns Données formatées
 */
function formatCompanyData(data: PappersCompanyData): CompanyInfo {
  // Construction de l'adresse complète
  const addressParts = [
    data.siege.adresse_ligne_1,
    data.siege.adresse_ligne_2,
    data.siege.code_postal,
    data.siege.ville,
  ].filter(Boolean);

  const address = addressParts.join(", ");

  return {
    siret: data.siret,
    name: data.nom_complet || data.nom_entreprise,
    address: address || "",
    vatNumber: data.numero_tva_intracommunautaire,
    legalForm: data.forme_juridique,
    registrationCity: data.ville_immatriculation,
  };
}

/**
 * Valide un numéro SIRET
 * @param siret - Numéro SIRET à valider
 * @returns true si valide, false sinon
 */
export function isValidSiret(siret: string): boolean {
  const cleanSiret = siret.replace(/\s/g, "").replace(/[^0-9]/g, "");
  return cleanSiret.length === 14;
}

/**
 * Valide un numéro SIREN
 * @param siren - Numéro SIREN à valider
 * @returns true si valide, false sinon
 */
export function isValidSiren(siren: string): boolean {
  const cleanSiren = siren.replace(/\s/g, "").replace(/[^0-9]/g, "");
  return cleanSiren.length === 9;
}

/**
 * Formate un numéro SIRET avec espaces
 * @param siret - Numéro SIRET à formater
 * @returns SIRET formaté (XXX XXX XXX XXXXX)
 */
export function formatSiret(siret: string): string {
  const cleanSiret = siret.replace(/\s/g, "").replace(/[^0-9]/g, "");
  if (cleanSiret.length !== 14) return siret;
  return `${cleanSiret.slice(0, 3)} ${cleanSiret.slice(3, 6)} ${cleanSiret.slice(
    6,
    9
  )} ${cleanSiret.slice(9)}`;
}

/**
 * Formate un numéro SIREN avec espaces
 * @param siren - Numéro SIREN à formater
 * @returns SIREN formaté (XXX XXX XXX)
 */
export function formatSiren(siren: string): string {
  const cleanSiren = siren.replace(/\s/g, "").replace(/[^0-9]/g, "");
  if (cleanSiren.length !== 9) return siren;
  return `${cleanSiren.slice(0, 3)} ${cleanSiren.slice(3, 6)} ${cleanSiren.slice(6)}`;
}
