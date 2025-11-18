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

// Minimal design with clean sans-serif and lots of whitespace
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff",
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

interface QuotePDFMinimalProps {
  quote: QuoteData;
  orgSettings?: OrgSettings;
}

const createStyles = (brandPrimary?: string) =>
  StyleSheet.create({
    page: {
      padding: 60,
      fontSize: 9,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF",
    },
    header: {
      marginBottom: 50,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
    },
    companyName: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 4,
    },
    companyDetails: {
      fontSize: 8,
      color: "#737373",
      lineHeight: 1.6,
    },
    quoteInfo: {
      textAlign: "right",
    },
    quoteTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 8,
      letterSpacing: -1,
    },
    quoteDetails: {
      fontSize: 8,
      color: "#737373",
      lineHeight: 1.6,
    },
    clientSection: {
      marginBottom: 50,
      paddingLeft: 2,
    },
    clientLabel: {
      fontSize: 7,
      color: "#a3a3a3",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    clientName: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 4,
      color: "#1a1a1a",
    },
    clientDetails: {
      fontSize: 8,
      color: "#525252",
      lineHeight: 1.7,
    },
    table: {
      marginBottom: 40,
    },
    tableHeader: {
      flexDirection: "row",
      paddingBottom: 10,
      marginBottom: 10,
      borderBottom: `1pt solid ${brandPrimary || "#1a1a1a"}`,
      fontSize: 7,
      color: "#a3a3a3",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 12,
      borderBottom: "0.5pt solid #e5e5e5",
      fontSize: 9,
    },
    tableRowLast: {
      flexDirection: "row",
      paddingVertical: 12,
      fontSize: 9,
    },
    colDescription: {
      flex: 3.5,
      paddingRight: 10,
      color: "#1a1a1a",
    },
    colQty: {
      flex: 0.6,
      textAlign: "right",
      paddingRight: 8,
      color: "#525252",
    },
    colUnit: {
      flex: 0.5,
      textAlign: "center",
      color: "#737373",
      fontSize: 8,
    },
    colPrice: {
      flex: 1,
      textAlign: "right",
      paddingRight: 8,
      color: "#525252",
    },
    colVAT: {
      flex: 0.6,
      textAlign: "right",
      paddingRight: 8,
      color: "#737373",
      fontSize: 8,
    },
    colTotal: {
      flex: 1.2,
      textAlign: "right",
      color: "#1a1a1a",
      fontWeight: "bold",
    },
    totalsSection: {
      marginTop: 30,
      marginLeft: "auto",
      width: 200,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      fontSize: 9,
    },
    totalLabel: {
      color: "#525252",
    },
    totalValue: {
      textAlign: "right",
      color: "#1a1a1a",
    },
    grandTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 12,
      marginTop: 12,
      borderTop: `2pt solid ${brandPrimary || "#1a1a1a"}`,
      fontSize: 14,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    termsSection: {
      marginTop: 60,
      paddingTop: 20,
      borderTop: "0.5pt solid #e5e5e5",
    },
    termsTitle: {
      fontSize: 8,
      color: "#a3a3a3",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
    },
    termsText: {
      fontSize: 8,
      lineHeight: 1.8,
      color: "#525252",
    },
    footer: {
      position: "absolute",
      bottom: 40,
      left: 60,
      right: 60,
      fontSize: 7,
      color: "#a3a3a3",
      textAlign: "center",
      lineHeight: 1.5,
    },
  });

export const QuotePDFMinimal = ({ quote, orgSettings }: QuotePDFMinimalProps) => {
  const styles = createStyles(orgSettings?.brand_primary);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {/* Company Info */}
            <View>
              <Text style={styles.companyName}>
                {orgSettings?.company_name || "Mon Entreprise"}
              </Text>
              <View style={styles.companyDetails}>
                {orgSettings?.address && <Text>{orgSettings.address}</Text>}
                {orgSettings?.phone && <Text>{orgSettings.phone}</Text>}
                {orgSettings?.vat_number && <Text>{orgSettings.vat_number}</Text>}
              </View>
            </View>

            {/* Quote Info */}
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteTitle}>Devis</Text>
              <View style={styles.quoteDetails}>
                <Text>{quote.number}</Text>
                <Text>{format(new Date(quote.created_at), "dd/MM/yyyy", { locale: fr })}</Text>
                {quote.expires_at && (
                  <Text>Expire le {format(new Date(quote.expires_at), "dd/MM/yyyy", { locale: fr })}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Client Section */}
          <View style={styles.clientSection}>
            <Text style={styles.clientLabel}>Pour</Text>
            <Text style={styles.clientName}>{quote.client.name}</Text>
            <View style={styles.clientDetails}>
              {quote.client.contact_name && <Text>{quote.client.contact_name}</Text>}
              {quote.client.address && <Text>{quote.client.address}</Text>}
              {quote.client.email && <Text>{quote.client.email}</Text>}
              {quote.client.phone && <Text>{quote.client.phone}</Text>}
            </View>
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
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {/* Table Rows */}
          {quote.items.map((item, index) => (
            <View
              key={index}
              style={index === quote.items.length - 1 ? styles.tableRowLast : styles.tableRow}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty.toFixed(2)}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{item.unit_price_ht.toFixed(2)} €</Text>
              <Text style={styles.colVAT}>{item.vat_rate}%</Text>
              <Text style={styles.colTotal}>{item.line_total_ht.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{quote.totals_ht.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{quote.totals_vat.toFixed(2)} €</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total TTC</Text>
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

        {/* Footer */}
        <View style={styles.footer}>
          {orgSettings?.footer_text && <Text>{orgSettings.footer_text}</Text>}
        </View>
      </Page>
    </Document>
  );
};
