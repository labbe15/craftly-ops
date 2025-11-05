/**
 * Service pour la génération d'exports FEC (Fichier des Écritures Comptables)
 * Conformément au format défini par l'administration fiscale française
 *
 * Référence : BOI-CF-IOR-60-40-20 (Bulletin officiel des finances publiques)
 */

import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Structure d'une ligne FEC
 * Les 18 colonnes obligatoires selon la norme
 */
interface FECLine {
  JournalCode: string;       // Code journal (VT = Ventes, AC = Achats, BQ = Banque, OD = Opérations diverses)
  JournalLib: string;        // Libellé journal
  EcritureNum: string;       // Numéro d'écriture (unique)
  EcritureDate: string;      // Date d'écriture (yyyyMMdd)
  CompteNum: string;         // Numéro de compte (plan comptable)
  CompteLib: string;         // Libellé du compte
  CompAuxNum: string;        // Numéro de compte auxiliaire (vide si non utilisé)
  CompAuxLib: string;        // Libellé du compte auxiliaire
  PieceRef: string;          // Référence de la pièce (n° facture, etc.)
  PieceDate: string;         // Date de la pièce (yyyyMMdd)
  EcritureLib: string;       // Libellé de l'écriture
  Debit: string;             // Montant au débit (format : 0.00)
  Credit: string;            // Montant au crédit (format : 0.00)
  EcritureLet: string;       // Lettrage (vide si non lettré)
  DateLet: string;           // Date de lettrage (yyyyMMdd ou vide)
  ValidDate: string;         // Date de validation (yyyyMMdd)
  Montantdevise: string;     // Montant en devise (vide si EUR)
  Idevise: string;           // Code devise (vide si EUR)
}

export interface FECExportOptions {
  startDate: Date;
  endDate: Date;
  siren: string;             // SIREN de l'entreprise (9 chiffres)
}

/**
 * Génère un export FEC pour une période donnée
 * @param options - Options de l'export (période et SIREN)
 * @returns Le contenu du fichier FEC au format texte
 */
export async function generateFEC(options: FECExportOptions): Promise<string> {
  const { startDate, endDate, siren } = options;

  // Récupération des factures de vente (invoices) de la période
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (invoicesError) {
    throw new Error("Erreur lors de la récupération des factures");
  }

  // Initialiser les lignes FEC
  const fecLines: FECLine[] = [];

  // Traiter chaque facture
  for (const invoice of invoices || []) {
    const invoiceDate = new Date(invoice.created_at);
    const invoiceDateStr = format(invoiceDate, "yyyyMMdd");
    const invoiceNum = invoice.number;

    // Client
    const clientCode = invoice.clients
      ? `C${invoice.clients.id.slice(0, 6).toUpperCase()}`
      : "CXXXXXX";
    const clientName = invoice.clients?.name || "Client inconnu";

    // Montants
    const totalTTC = Number(invoice.totals_ttc);
    const totalHT = Number(invoice.totals_ht);
    const totalVAT = Number(invoice.totals_vat);

    // 1. Écriture de débit : Compte client (411xxx)
    fecLines.push({
      JournalCode: "VT",
      JournalLib: "Ventes",
      EcritureNum: invoiceNum,
      EcritureDate: invoiceDateStr,
      CompteNum: `411${clientCode}`,
      CompteLib: "Clients",
      CompAuxNum: clientCode,
      CompAuxLib: clientName,
      PieceRef: invoiceNum,
      PieceDate: invoiceDateStr,
      EcritureLib: `Facture ${invoiceNum} - ${clientName}`,
      Debit: totalTTC.toFixed(2),
      Credit: "0.00",
      EcritureLet: invoice.status === "paid" ? "A" : "",
      DateLet: invoice.paid_at ? format(new Date(invoice.paid_at), "yyyyMMdd") : "",
      ValidDate: invoiceDateStr,
      Montantdevise: "",
      Idevise: "",
    });

    // 2. Écriture de crédit : Ventes de prestations (706000)
    fecLines.push({
      JournalCode: "VT",
      JournalLib: "Ventes",
      EcritureNum: invoiceNum,
      EcritureDate: invoiceDateStr,
      CompteNum: "706000",
      CompteLib: "Prestations de services",
      CompAuxNum: "",
      CompAuxLib: "",
      PieceRef: invoiceNum,
      PieceDate: invoiceDateStr,
      EcritureLib: `Facture ${invoiceNum} - ${clientName}`,
      Debit: "0.00",
      Credit: totalHT.toFixed(2),
      EcritureLet: "",
      DateLet: "",
      ValidDate: invoiceDateStr,
      Montantdevise: "",
      Idevise: "",
    });

    // 3. Écriture de crédit : TVA collectée (445710)
    if (totalVAT > 0) {
      fecLines.push({
        JournalCode: "VT",
        JournalLib: "Ventes",
        EcritureNum: invoiceNum,
        EcritureDate: invoiceDateStr,
        CompteNum: "445710",
        CompteLib: "TVA collectée",
        CompAuxNum: "",
        CompAuxLib: "",
        PieceRef: invoiceNum,
        PieceDate: invoiceDateStr,
        EcritureLib: `TVA sur facture ${invoiceNum}`,
        Debit: "0.00",
        Credit: totalVAT.toFixed(2),
        EcritureLet: "",
        DateLet: "",
        ValidDate: invoiceDateStr,
        Montantdevise: "",
        Idevise: "",
      });
    }

    // 4. Si la facture est payée, ajouter l'écriture de règlement
    if (invoice.status === "paid" && invoice.paid_at) {
      const paidDate = new Date(invoice.paid_at);
      const paidDateStr = format(paidDate, "yyyyMMdd");

      // Débit : Banque (512000)
      fecLines.push({
        JournalCode: "BQ",
        JournalLib: "Banque",
        EcritureNum: `REG-${invoiceNum}`,
        EcritureDate: paidDateStr,
        CompteNum: "512000",
        CompteLib: "Banque",
        CompAuxNum: "",
        CompAuxLib: "",
        PieceRef: invoiceNum,
        PieceDate: paidDateStr,
        EcritureLib: `Règlement facture ${invoiceNum}`,
        Debit: totalTTC.toFixed(2),
        Credit: "0.00",
        EcritureLet: "A",
        DateLet: paidDateStr,
        ValidDate: paidDateStr,
        Montantdevise: "",
        Idevise: "",
      });

      // Crédit : Compte client (411xxx)
      fecLines.push({
        JournalCode: "BQ",
        JournalLib: "Banque",
        EcritureNum: `REG-${invoiceNum}`,
        EcritureDate: paidDateStr,
        CompteNum: `411${clientCode}`,
        CompteLib: "Clients",
        CompAuxNum: clientCode,
        CompAuxLib: clientName,
        PieceRef: invoiceNum,
        PieceDate: paidDateStr,
        EcritureLib: `Règlement facture ${invoiceNum}`,
        Debit: "0.00",
        Credit: totalTTC.toFixed(2),
        EcritureLet: "A",
        DateLet: paidDateStr,
        ValidDate: paidDateStr,
        Montantdevise: "",
        Idevise: "",
      });
    }
  }

  // Générer le contenu du fichier FEC
  return formatFECFile(fecLines);
}

/**
 * Formate les lignes FEC en fichier texte selon la norme
 * @param lines - Lignes FEC à formater
 * @returns Le contenu du fichier au format texte
 */
function formatFECFile(lines: FECLine[]): string {
  // En-tête du fichier (18 colonnes séparées par des pipes)
  const header = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ].join("|");

  // Lignes de données
  const dataLines = lines.map((line) =>
    [
      line.JournalCode,
      line.JournalLib,
      line.EcritureNum,
      line.EcritureDate,
      line.CompteNum,
      line.CompteLib,
      line.CompAuxNum,
      line.CompAuxLib,
      line.PieceRef,
      line.PieceDate,
      line.EcritureLib,
      line.Debit,
      line.Credit,
      line.EcritureLet,
      line.DateLet,
      line.ValidDate,
      line.Montantdevise,
      line.Idevise,
    ].join("|")
  );

  return [header, ...dataLines].join("\n");
}

/**
 * Génère le nom de fichier FEC selon la norme
 * Format : SIREN + FEC + Date de clôture (AAAAMMJJ).txt
 * @param siren - SIREN de l'entreprise (9 chiffres)
 * @param endDate - Date de fin de période
 * @returns Le nom du fichier
 */
export function generateFECFilename(siren: string, endDate: Date): string {
  const dateStr = format(endDate, "yyyyMMdd");
  return `${siren}FEC${dateStr}.txt`;
}

/**
 * Déclenche le téléchargement du fichier FEC
 * @param content - Contenu du fichier
 * @param filename - Nom du fichier
 */
export function downloadFECFile(content: string, filename: string): void {
  // Créer un blob avec le contenu
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

  // Créer un lien de téléchargement
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valide un numéro SIREN
 * @param siren - Numéro SIREN à valider
 * @returns true si valide, false sinon
 */
export function isValidSIREN(siren: string): boolean {
  const cleanSiren = siren.replace(/\s/g, "");
  return /^\d{9}$/.test(cleanSiren);
}
