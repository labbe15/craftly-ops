import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuoteData {
  number: string;
  client: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
  }>;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  createdAt: Date;
  expiresAt?: Date;
}

interface InvoiceData extends QuoteData {
  dueDate?: Date;
}

export function generateQuotePDF(data: QuoteData): void {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text("DEVIS", 20, 20);

  // Numéro de devis
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° ${data.number}`, 20, 30);
  doc.text(`Date: ${format(data.createdAt, "dd MMMM yyyy", { locale: fr })}`, 20, 35);
  if (data.expiresAt) {
    doc.text(`Valable jusqu'au: ${format(data.expiresAt, "dd MMMM yyyy", { locale: fr })}`, 20, 40);
  }

  // Informations entreprise (à droite)
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text(data.company.name || "Votre Entreprise", 120, 20);
  doc.setFont(undefined, "normal");
  if (data.company.address) {
    const addressLines = doc.splitTextToSize(data.company.address, 70);
    doc.text(addressLines, 120, 25);
  }
  if (data.company.phone) doc.text(data.company.phone, 120, 35);
  if (data.company.email) doc.text(data.company.email, 120, 40);

  // Client
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("CLIENT", 20, 55);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(data.client.name, 20, 62);
  if (data.client.address) {
    const clientAddressLines = doc.splitTextToSize(data.client.address, 80);
    doc.text(clientAddressLines, 20, 67);
  }
  if (data.client.email) doc.text(data.client.email, 20, 77);
  if (data.client.phone) doc.text(data.client.phone, 20, 82);

  // Table des articles
  const tableData = data.items.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit,
    `${item.unit_price.toFixed(2)} €`,
    `${item.vat_rate}%`,
    `${(item.quantity * item.unit_price).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Description", "Qté", "Unité", "P.U. HT", "TVA", "Total HT"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  // Totaux
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text("Total HT:", 140, finalY);
  doc.text(`${data.totalHT.toFixed(2)} €`, 180, finalY, { align: "right" });

  doc.text("Total TVA:", 140, finalY + 6);
  doc.text(`${data.totalVAT.toFixed(2)} €`, 180, finalY + 6, { align: "right" });

  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Total TTC:", 140, finalY + 14);
  doc.text(`${data.totalTTC.toFixed(2)} €`, 180, finalY + 14, { align: "right" });

  // Pied de page
  doc.setFontSize(8);
  doc.setFont(undefined, "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Devis valable 30 jours. TVA non applicable selon l'article 293 B du CGI.",
    105,
    280,
    { align: "center" }
  );

  // Télécharger le PDF
  doc.save(`devis-${data.number}.pdf`);
}

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(24);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text("FACTURE", 20, 20);

  // Numéro de facture
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° ${data.number}`, 20, 30);
  doc.text(`Date: ${format(data.createdAt, "dd MMMM yyyy", { locale: fr })}`, 20, 35);
  if (data.dueDate) {
    doc.text(`Échéance: ${format(data.dueDate, "dd MMMM yyyy", { locale: fr })}`, 20, 40);
  }

  // Informations entreprise (à droite)
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text(data.company.name || "Votre Entreprise", 120, 20);
  doc.setFont(undefined, "normal");
  if (data.company.address) {
    const addressLines = doc.splitTextToSize(data.company.address, 70);
    doc.text(addressLines, 120, 25);
  }
  if (data.company.phone) doc.text(data.company.phone, 120, 35);
  if (data.company.email) doc.text(data.company.email, 120, 40);

  // Client
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("CLIENT", 20, 55);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(data.client.name, 20, 62);
  if (data.client.address) {
    const clientAddressLines = doc.splitTextToSize(data.client.address, 80);
    doc.text(clientAddressLines, 20, 67);
  }
  if (data.client.email) doc.text(data.client.email, 20, 77);
  if (data.client.phone) doc.text(data.client.phone, 20, 82);

  // Table des articles
  const tableData = data.items.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit,
    `${item.unit_price.toFixed(2)} €`,
    `${item.vat_rate}%`,
    `${(item.quantity * item.unit_price).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Description", "Qté", "Unité", "P.U. HT", "TVA", "Total HT"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  // Totaux
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text("Total HT:", 140, finalY);
  doc.text(`${data.totalHT.toFixed(2)} €`, 180, finalY, { align: "right" });

  doc.text("Total TVA:", 140, finalY + 6);
  doc.text(`${data.totalVAT.toFixed(2)} €`, 180, finalY + 6, { align: "right" });

  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Total TTC:", 140, finalY + 14);
  doc.text(`${data.totalTTC.toFixed(2)} €`, 180, finalY + 14, { align: "right" });

  // Conditions de paiement
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Paiement à réception de facture", 20, finalY + 30);

  // Pied de page
  doc.setFontSize(8);
  doc.setFont(undefined, "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "TVA non applicable selon l'article 293 B du CGI. En cas de retard de paiement, indemnité forfaitaire de 40€.",
    105,
    280,
    { align: "center" }
  );

  // Télécharger le PDF
  doc.save(`facture-${data.number}.pdf`);
}
