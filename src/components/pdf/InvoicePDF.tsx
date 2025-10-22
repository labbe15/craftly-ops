import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Register font (optional - using Helvetica by default)
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica-bold@1.0.4/Helvetica-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

interface InvoiceData {
  number: string;
  created_at: string;
  due_date?: string;
  notes?: string;
  totals_ht: number;
  totals_vat: number;
  totals_ttc: number;
  status: string;
  client: {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    qty: number;
    unit: string;
    unit_price_ht: number;
    vat_rate: number;
    line_total_ht: number;
  }>;
}

interface OrgSettings {
  company_name?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  brand_primary?: string;
  footer_text?: string;
}

interface InvoicePDFProps {
  invoice: InvoiceData;
  orgSettings?: OrgSettings;
}

const createStyles = (brandPrimary?: string) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF",
    },
    header: {
      marginBottom: 30,
      paddingBottom: 20,
      borderBottom: `2pt solid ${brandPrimary || "#3b82f6"}`,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: 18,
      fontWeight: "bold",
      color: brandPrimary || "#3b82f6",
      marginBottom: 8,
    },
    companyDetails: {
      fontSize: 9,
      color: "#666666",
      lineHeight: 1.4,
    },
    invoiceTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1a1a1a",
      textAlign: "right",
      marginBottom: 4,
    },
    invoiceNumber: {
      fontSize: 12,
      color: "#666666",
      textAlign: "right",
      marginBottom: 2,
    },
    statusBadge: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#FFFFFF",
      backgroundColor: brandPrimary || "#3b82f6",
      padding: "4 8",
      borderRadius: 4,
      textAlign: "center",
      marginTop: 4,
      alignSelf: "flex-end",
    },
    clientSection: {
      marginTop: 20,
      marginBottom: 30,
      padding: 15,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#333333",
      marginBottom: 8,
    },
    clientName: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 4,
    },
    clientDetails: {
      fontSize: 9,
      color: "#666666",
      lineHeight: 1.5,
    },
    table: {
      marginTop: 20,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: brandPrimary || "#3b82f6",
      padding: 8,
      fontWeight: "bold",
      color: "#FFFFFF",
      fontSize: 9,
    },
    tableRow: {
      flexDirection: "row",
      borderBottom: "1pt solid #e5e7eb",
      padding: 8,
      fontSize: 9,
    },
    tableRowAlt: {
      flexDirection: "row",
      backgroundColor: "#f9fafb",
      borderBottom: "1pt solid #e5e7eb",
      padding: 8,
      fontSize: 9,
    },
    colDescription: {
      flex: 3,
      paddingRight: 5,
    },
    colQty: {
      flex: 0.8,
      textAlign: "right",
      paddingRight: 5,
    },
    colUnit: {
      flex: 0.6,
      textAlign: "center",
    },
    colPrice: {
      flex: 1,
      textAlign: "right",
      paddingRight: 5,
    },
    colVAT: {
      flex: 0.7,
      textAlign: "right",
      paddingRight: 5,
    },
    colTotal: {
      flex: 1.2,
      textAlign: "right",
    },
    totalsSection: {
      marginTop: 20,
      marginLeft: "auto",
      width: 200,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      fontSize: 10,
    },
    totalLabel: {
      color: "#666666",
    },
    totalValue: {
      fontWeight: "bold",
      textAlign: "right",
    },
    grandTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      paddingVertical: 8,
      marginTop: 8,
      borderTop: `2pt solid ${brandPrimary || "#3b82f6"}`,
      fontSize: 13,
      fontWeight: "bold",
    },
    paymentInfo: {
      marginTop: 30,
      padding: 15,
      backgroundColor: "#fff9e6",
      borderRadius: 4,
      borderLeft: `4pt solid ${brandPrimary || "#3b82f6"}`,
    },
    paymentTitle: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#333333",
    },
    paymentText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: "#666666",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      paddingTop: 10,
      borderTop: "1pt solid #e5e7eb",
      fontSize: 7,
      color: "#999999",
      textAlign: "center",
      lineHeight: 1.5,
    },
  });

export const InvoicePDF = ({ invoice, orgSettings }: InvoicePDFProps) => {
  const styles = createStyles(orgSettings?.brand_primary);

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "PAYÉE";
      case "sent":
        return "ENVOYÉE";
      case "overdue":
        return "EN RETARD";
      case "draft":
        return "BROUILLON";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {/* Company Info */}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                {orgSettings?.company_name || "Mon Entreprise"}
              </Text>
              <View style={styles.companyDetails}>
                {orgSettings?.address && <Text>{orgSettings.address}</Text>}
                {orgSettings?.phone && <Text>Tél : {orgSettings.phone}</Text>}
                {orgSettings?.vat_number && (
                  <Text>SIRET / TVA : {orgSettings.vat_number}</Text>
                )}
              </View>
            </View>

            {/* Invoice Title */}
            <View>
              <Text style={styles.invoiceTitle}>FACTURE</Text>
              <Text style={styles.invoiceNumber}>N° {invoice.number}</Text>
              <Text style={styles.invoiceNumber}>
                Date :{" "}
                {format(new Date(invoice.created_at), "dd/MM/yyyy", {
                  locale: fr,
                })}
              </Text>
              {invoice.due_date && (
                <Text style={styles.invoiceNumber}>
                  Échéance :{" "}
                  {format(new Date(invoice.due_date), "dd/MM/yyyy", {
                    locale: fr,
                  })}
                </Text>
              )}
              <View style={styles.statusBadge}>
                <Text>{getStatusText(invoice.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client Section */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <Text style={styles.clientName}>{invoice.client.name}</Text>
          <View style={styles.clientDetails}>
            {invoice.client.contact_name && (
              <Text>Contact : {invoice.client.contact_name}</Text>
            )}
            {invoice.client.address && <Text>{invoice.client.address}</Text>}
            {invoice.client.phone && <Text>Tél : {invoice.client.phone}</Text>}
            {invoice.client.email && (
              <Text>Email : {invoice.client.email}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>Unité</Text>
            <Text style={styles.colPrice}>Prix HT</Text>
            <Text style={styles.colVAT}>TVA</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>

          {/* Table Rows */}
          {invoice.items.map((item, index) => (
            <View
              key={index}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty.toFixed(2)}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>
                {item.unit_price_ht.toFixed(2)} €
              </Text>
              <Text style={styles.colVAT}>{item.vat_rate}%</Text>
              <Text style={styles.colTotal}>
                {item.line_total_ht.toFixed(2)} €
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT :</Text>
            <Text style={styles.totalValue}>
              {invoice.totals_ht.toFixed(2)} €
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TVA :</Text>
            <Text style={styles.totalValue}>
              {invoice.totals_vat.toFixed(2)} €
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total TTC :</Text>
            <Text>{invoice.totals_ttc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Informations de paiement</Text>
          <View style={styles.paymentText}>
            {invoice.due_date && (
              <Text>
                Cette facture est à régler avant le{" "}
                {format(new Date(invoice.due_date), "dd/MM/yyyy", {
                  locale: fr,
                })}
              </Text>
            )}
            <Text style={{ marginTop: 4 }}>
              Merci de mentionner le numéro de facture {invoice.number} lors du
              paiement.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {orgSettings?.footer_text && (
            <Text>{orgSettings.footer_text}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
