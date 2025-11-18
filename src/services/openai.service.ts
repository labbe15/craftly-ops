// OpenAI Service for Craftly AI
// This service handles all AI-related operations

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  message: string;
  tokens: number;
}

class OpenAIService {
  private apiKey: string | undefined;
  private model: string = "gpt-4";
  private baseURL: string = "https://api.openai.com/v1";

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Chat completion
  async chatCompletion(messages: Message[]): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API request failed");
      }

      const data = await response.json();

      return {
        message: data.choices[0].message.content,
        tokens: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw error;
    }
  }

  // Generate contextual response for CRM
  async generateCRMResponse(userMessage: string, context?: string): Promise<string> {
    const systemPrompt = `Tu es Craftly AI, l'assistant intelligent du CRM pour artisans Craftly Ops.

Tu aides les artisans à :
- Rechercher des informations (clients, projets, devis, factures)
- Créer du contenu (emails, descriptions)
- Analyser leurs données (CA, stats)
- Donner des conseils business

Contexte actuel: ${context || "Page d'accueil"}

Sois concis, professionnel et utile. Limite tes réponses à 2-3 phrases sauf si plus de détails sont demandés.`;

    const response = await this.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ]);

    return response.message;
  }

  // Generate email
  async generateEmail(context: {
    type: "follow_up" | "quote" | "invoice" | "reminder" | "thank_you";
    clientName?: string;
    details?: string;
  }): Promise<string> {
    const prompts = {
      follow_up: "Rédige un email de relance professionnel mais amical pour un devis",
      quote: "Rédige un email d'envoi de devis professionnel",
      invoice: "Rédige un email d'envoi de facture courtois",
      reminder: "Rédige un email de rappel de paiement poli mais ferme",
      thank_you: "Rédige un email de remerciement après un projet terminé",
    };

    const systemPrompt = `Tu es un expert en communication professionnelle pour artisans.
Rédige un email en français, professionnel mais chaleureux.
Format: Objet + Corps du message
${context.clientName ? `Client: ${context.clientName}` : ""}
${context.details ? `Détails: ${context.details}` : ""}`;

    const response = await this.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompts[context.type] },
    ]);

    return response.message;
  }

  // Analyze text (sentiment, category, etc.)
  async analyzeText(text: string, analysisType: "sentiment" | "category" | "urgency"): Promise<string> {
    const prompts = {
      sentiment: "Analyse le sentiment de ce texte (positif/neutre/négatif) et explique pourquoi en 1 phrase",
      category: "Catégorise ce texte (demande devis/question/réclamation/autre) et explique",
      urgency: "Détermine le niveau d'urgence (faible/moyen/élevé/urgent) et explique",
    };

    const response = await this.chatCompletion([
      { role: "system", content: "Tu es un expert en analyse de texte." },
      { role: "user", content: `${prompts[analysisType]}\n\nTexte: "${text}"` },
    ]);

    return response.message;
  }

  // Generate project description
  async generateProjectDescription(projectData: {
    type?: string;
    location?: string;
    scope?: string;
  }): Promise<string> {
    const prompt = `Génère une description professionnelle de projet de ${projectData.type || "rénovation"}${projectData.location ? ` à ${projectData.location}` : ""}.
${projectData.scope ? `Étendue: ${projectData.scope}` : ""}

Format: 2-3 phrases décrivant le projet de manière professionnelle.`;

    const response = await this.chatCompletion([
      { role: "system", content: "Tu rédiges des descriptions de projets pour artisans." },
      { role: "user", content: prompt },
    ]);

    return response.message;
  }

  // Extract data from text (OCR results, etc.)
  async extractData(text: string, dataType: "invoice" | "receipt" | "contact"): Promise<any> {
    const prompts = {
      invoice: "Extrais les informations de cette facture: fournisseur, montant HT, TVA, TTC, date. Réponds en JSON.",
      receipt: "Extrais: montant, date, catégorie de dépense. Réponds en JSON.",
      contact: "Extrais: nom, entreprise, email, téléphone. Réponds en JSON.",
    };

    const response = await this.chatCompletion([
      { role: "system", content: "Tu es un expert en extraction de données. Réponds uniquement en JSON valide." },
      { role: "user", content: `${prompts[dataType]}\n\nTexte:\n${text}` },
    ]);

    try {
      // Try to parse JSON from response
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: response.message };
    } catch {
      return { raw: response.message };
    }
  }

  // Get suggestions
  async getSuggestions(context: string, type: "pricing" | "timeline" | "materials"): Promise<string[]> {
    const prompts = {
      pricing: "Donne 3 suggestions de prix pour ce projet (fourchette basse/moyenne/haute)",
      timeline: "Suggère 3 délais réalistes pour ce projet",
      materials: "Liste 5 matériaux essentiels pour ce projet",
    };

    const response = await this.chatCompletion([
      { role: "system", content: "Tu es un expert métier pour artisans. Sois concis et pratique." },
      { role: "user", content: `${prompts[type]}\n\nContexte: ${context}` },
    ]);

    // Parse response into array
    const lines = response.message.split("\n").filter((line) => line.trim());
    return lines.slice(0, type === "materials" ? 5 : 3);
  }
}

export const openaiService = new OpenAIService();
