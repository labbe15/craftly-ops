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

// Classic design with serif fonts and traditional layout
Font.register({
  family: "Times",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times-New-Roman.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-bold@1.0.4/Times-New-Roman-Bold.ttf",
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

interface QuotePDFClassicProps {
  quote: QuoteData;
  orgSettings?: OrgSettings;
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Times",
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 40,
    paddingBottom: 15,
    borderBottom: "3pt double #1a1a1a",
  },
  companySection: {
    marginBottom: 15,
    textAlign: "center",
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  companyDetails: {
    fontSize: 10,
    color: "#4a4a4a",
    lineHeight: 1.5,
    textAlign: "center",
  },
  divider: {
    borderBottom: "1pt solid #cccccc",
    marginVertical: 10,
  },
  quoteHeader: {
    textAlign: "center",
    marginTop: 15,
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  quoteInfo: {
    fontSize: 10,
    color: "#666666",
    lineHeight: 1.4,
  },
  clientSection: {
    marginTop: 30,
    marginBottom: 30,
    padding: 15,
    border: "1pt solid #cccccc",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },
  clientDetails: {
    fontSize: 10,
    color: "#4a4a4a",
    lineHeight: 1.6,
  },
  table: {
    marginTop: 25,
    marginBottom: 25,
    border: "2pt solid #1a1a1a",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontSize: 10,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #cccccc",
    padding: 10,
    fontSize: 10,
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottom: "1pt solid #cccccc",
    padding: 10,
    fontSize: 10,
  },
  colDescription: {
    flex: 3,
    paddingRight: 5,
  },
  colQty: {
    flex: 0.7,
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
    flex: 0.6,
    textAlign: "right",
    paddingRight: 5,
  },
  colTotal: {
    flex: 1.2,
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 25,
    marginLeft: "auto",
    width: 220,
    border: "2pt solid #1a1a1a",
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    fontSize: 11,
  },
  totalLabel: {
    color: "#4a4a4a",
    fontWeight: "bold",
  },
  totalValue: {
    fontWeight: "bold",
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 10,
    borderTop: "2pt double #1a1a1a",
    fontSize: 14,
    fontWeight: "bold",
  },
  termsSection: {
    marginTop: 30,
    padding: 15,
    border: "1pt solid #cccccc",
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a1a1a",
    textTransform: "uppercase",
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.7,
    color: "#4a4a4a",
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    paddingTop: 12,
    borderTop: "2pt double #1a1a1a",
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
    lineHeight: 1.6,
  },
  watermark: {
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },
});

export const QuotePDFClassic = ({ quote, orgSettings }: QuotePDFClassicProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Company Info */}
          <View style={styles.companySection}>
            <Text style={styles.companyName}>
              {orgSettings?.company_name || "Mon Entreprise"}
            </Text>
            <View style={styles.companyDetails}>
              {orgSettings?.address && <Text>{orgSettings.address}</Text>}
              {orgSettings?.phone && <Text>Téléphone : {orgSettings.phone}</Text>}
              {orgSettings?.vat_number && (
                <Text>SIRET / N° TVA : {orgSettings.vat_number}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quote Title & Info */}
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteTitle}>Devis</Text>
            <View style={styles.quoteInfo}>
              <Text>Numéro : {quote.number}</Text>
              <Text>
                Établi le {format(new Date(quote.created_at), "dd MMMM yyyy", { locale: fr })}
              </Text>
              {quote.expires_at && (
                <Text>
                  Valable jusqu'au {format(new Date(quote.expires_at), "dd MMMM yyyy", { locale: fr })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Client Section */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <Text style={styles.clientName}>{quote.client.name}</Text>
          <View style={styles.clientDetails}>
            {quote.client.contact_name && <Text>À l'attention de : {quote.client.contact_name}</Text>}
            {quote.client.address && <Text>{quote.client.address}</Text>}
            {quote.client.phone && <Text>Téléphone : {quote.client.phone}</Text>}
            {quote.client.email && <Text>Courriel : {quote.client.email}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Désignation</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>Unité</Text>
            <Text style={styles.colPrice}>P.U. HT</Text>
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
              <Text style={styles.colPrice}>{item.unit_price_ht.toFixed(2)} €</Text>
              <Text style={styles.colVAT}>{item.vat_rate}%</Text>
              <Text style={styles.colTotal}>{item.line_total_ht.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Hors Taxes :</Text>
            <Text style={styles.totalValue}>{quote.totals_ht.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant TVA :</Text>
            <Text style={styles.totalValue}>{quote.totals_vat.toFixed(2)} €</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total Toutes Taxes Comprises :</Text>
            <Text>{quote.totals_ttc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Terms */}
        {quote.terms_text && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Conditions Générales</Text>
            <Text style={styles.termsText}>{quote.terms_text}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {orgSettings?.footer_text && <Text>{orgSettings.footer_text}</Text>}
          <Text style={styles.watermark}>Document généré par Craftly Ops</Text>
        </View>
      </Page>
    </Document>
  );
};
