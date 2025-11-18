// PDF Template Registry
// Exports all available templates with metadata

import { QuotePDF } from "../QuotePDF";
import { InvoicePDF } from "../InvoicePDF";
import { QuotePDFClassic } from "./QuotePDFClassic";
import { QuotePDFMinimal } from "./QuotePDFMinimal";
import { InvoicePDFClassic } from "./InvoicePDFClassic";
import { InvoicePDFMinimal } from "./InvoicePDFMinimal";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  type: "quote" | "invoice";
  component: React.ComponentType<any>;
}

export const quoteTemplates: TemplateMetadata[] = [
  {
    id: "quote-modern",
    name: "Modern",
    description: "Design moderne et professionnel avec couleurs accent",
    type: "quote",
    component: QuotePDF,
  },
  {
    id: "quote-classic",
    name: "Classic",
    description: "Style traditionnel avec police serif et bordures élégantes",
    type: "quote",
    component: QuotePDFClassic,
  },
  {
    id: "quote-minimal",
    name: "Minimal",
    description: "Design épuré et minimaliste avec beaucoup d'espace",
    type: "quote",
    component: QuotePDFMinimal,
  },
];

export const invoiceTemplates: TemplateMetadata[] = [
  {
    id: "invoice-modern",
    name: "Modern",
    description: "Design moderne et professionnel avec couleurs accent",
    type: "invoice",
    component: InvoicePDF,
  },
  {
    id: "invoice-classic",
    name: "Classic",
    description: "Style traditionnel avec police serif et bordures élégantes",
    type: "invoice",
    component: InvoicePDFClassic,
  },
  {
    id: "invoice-minimal",
    name: "Minimal",
    description: "Design épuré et minimaliste avec beaucoup d'espace",
    type: "invoice",
    component: InvoicePDFMinimal,
  },
];

export const allTemplates = [...quoteTemplates, ...invoiceTemplates];

export function getTemplateById(id: string): TemplateMetadata | undefined {
  return allTemplates.find((t) => t.id === id);
}

export function getTemplatesByType(type: "quote" | "invoice"): TemplateMetadata[] {
  return type === "quote" ? quoteTemplates : invoiceTemplates;
}

export function getDefaultTemplate(type: "quote" | "invoice"): TemplateMetadata {
  return type === "quote" ? quoteTemplates[0] : invoiceTemplates[0];
}
