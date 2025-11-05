import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
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

interface QuoteData {
  number: string;
  created_at: string;
  expires_at?: string;
  terms_text?: string;
  notes?: string;
  totals_ht: number;
  totals_vat: number;
  totals_ttc: number;
  signature_url?: string;
  signed_at?: string;
  signed_by_name?: string;
  signed_by_email?: string;
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

interface QuotePDFProps {
  quote: QuoteData;
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
    quoteTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1a1a1a",
      textAlign: "right",
      marginBottom: 4,
    },
    quoteNumber: {
      fontSize: 12,
      color: "#666666",
      textAlign: "right",
      marginBottom: 2,
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
    termsSection: {
      marginTop: 30,
      padding: 15,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
    },
    termsTitle: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#333333",
    },
    termsText: {
      fontSize: 8,
      lineHeight: 1.6,
      color: "#666666",
    },
    signatureSection: {
      marginTop: 30,
      padding: 15,
      backgroundColor: "#f0fdf4",
      borderRadius: 4,
      borderLeft: `4pt solid ${brandPrimary || "#3b82f6"}`,
    },
    signatureTitle: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 12,
      color: "#166534",
    },
    signatureImage: {
      width: 150,
      height: 60,
      marginBottom: 8,
      objectFit: "contain",
    },
    signatureInfo: {
      fontSize: 8,
      color: "#666666",
      lineHeight: 1.5,
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

export const QuotePDF = ({ quote, orgSettings }: QuotePDFProps) => {
  const styles = createStyles(orgSettings?.brand_primary);

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

            {/* Quote Title */}
            <View>
              <Text style={styles.quoteTitle}>DEVIS</Text>
              <Text style={styles.quoteNumber}>N° {quote.number}</Text>
              <Text style={styles.quoteNumber}>
                Date :{" "}
                {format(new Date(quote.created_at), "dd/MM/yyyy", {
                  locale: fr,
                })}
              </Text>
              {quote.expires_at && (
                <Text style={styles.quoteNumber}>
                  Valable jusqu'au :{" "}
                  {format(new Date(quote.expires_at), "dd/MM/yyyy", {
                    locale: fr,
                  })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Client Section */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <Text style={styles.clientName}>{quote.client.name}</Text>
          <View style={styles.clientDetails}>
            {quote.client.contact_name && (
              <Text>Contact : {quote.client.contact_name}</Text>
            )}
            {quote.client.address && <Text>{quote.client.address}</Text>}
            {quote.client.phone && <Text>Tél : {quote.client.phone}</Text>}
            {quote.client.email && <Text>Email : {quote.client.email}</Text>}
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
          {quote.items.map((item, index) => (
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
              {quote.totals_ht.toFixed(2)} €
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TVA :</Text>
            <Text style={styles.totalValue}>
              {quote.totals_vat.toFixed(2)} €
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total TTC :</Text>
            <Text>{quote.totals_ttc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Terms */}
        {quote.terms_text && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Conditions</Text>
            <Text style={styles.termsText}>{quote.terms_text}</Text>
          </View>
        )}

        {/* Signature */}
        {quote.signature_url && (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>✓ Devis signé électroniquement</Text>
            <Image src={quote.signature_url} style={styles.signatureImage} />
            <View style={styles.signatureInfo}>
              {quote.signed_by_name && (
                <Text>Signé par : {quote.signed_by_name}</Text>
              )}
              {quote.signed_by_email && (
                <Text>Email : {quote.signed_by_email}</Text>
              )}
              {quote.signed_at && (
                <Text>
                  Date : {format(new Date(quote.signed_at), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                </Text>
              )}
            </View>
          </View>
        )}

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
