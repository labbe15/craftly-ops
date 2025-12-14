import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type OrgSettings = Tables<"org_settings">;

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  orgId: string;
  relatedType?: "quote" | "invoice";
  relatedId?: string;
  templateKey?: string;
}

export async function sendEmail(params: EmailParams) {
  const { to, subject, html, orgId, relatedType, relatedId, templateKey } = params;

  try {
    // Create mail log entry
    const mailLogEntry: TablesInsert<"mail_log"> = {
      org_id: orgId,
      to_email: to,
      subject,
      template_key: templateKey,
      related_type: relatedType,
      related_id: relatedId,
      status: "queued",
    };

    const { data: logData, error: logError } = await supabase
      .from("mail_log")
      .insert(mailLogEntry)
      .select()
      .single();

    if (logError) throw logError;

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html, org_id: orgId },
    });

    if (error) {
      // Update mail log with failed status
      await supabase
        .from("mail_log")
        .update({ status: "failed" })
        .eq("id", logData.id);

      throw error;
    }

    // Update mail log with success
    await supabase
      .from("mail_log")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: data?.id || null,
      })
      .eq("id", logData.id);

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Email template generators
export function generateQuoteEmailHTML(params: {
  clientName: string;
  quoteNumber: string;
  companyName: string;
  expiresAt?: string;
  totals_ttc: number;
  brandPrimary?: string;
}): string {
  const { clientName, quoteNumber, companyName, expiresAt, totals_ttc, brandPrimary = "#3b82f6" } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${brandPrimary}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background-color: ${brandPrimary}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .info-box { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${brandPrimary}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouveau Devis</h1>
          </div>
          <div class="content">
            <p>Bonjour ${clientName},</p>

            <p>Nous avons le plaisir de vous transmettre notre devis <strong>${quoteNumber}</strong>.</p>

            <div class="info-box">
              <p><strong>Montant total TTC :</strong> ${totals_ttc.toFixed(2)} €</p>
              ${expiresAt ? `<p><strong>Valable jusqu'au :</strong> ${new Date(expiresAt).toLocaleDateString('fr-FR')}</p>` : ''}
            </div>

            <p>Vous trouverez le devis détaillé en pièce jointe au format PDF.</p>

            <p>N'hésitez pas à nous contacter si vous avez des questions ou souhaitez discuter de ce devis.</p>

            <p>Cordialement,<br>${companyName}</p>
          </div>
          <div class="footer">
            <p>Ce message a été envoyé automatiquement via Craftly Ops</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateInvoiceEmailHTML(params: {
  clientName: string;
  invoiceNumber: string;
  companyName: string;
  dueDate?: string;
  totals_ttc: number;
  brandPrimary?: string;
}): string {
  const { clientName, invoiceNumber, companyName, dueDate, totals_ttc, brandPrimary = "#3b82f6" } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${brandPrimary}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background-color: ${brandPrimary}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .info-box { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${brandPrimary}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle Facture</h1>
          </div>
          <div class="content">
            <p>Bonjour ${clientName},</p>

            <p>Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong>.</p>

            <div class="info-box">
              <p><strong>Montant total TTC :</strong> ${totals_ttc.toFixed(2)} €</p>
              ${dueDate ? `<p><strong>Date d'échéance :</strong> ${new Date(dueDate).toLocaleDateString('fr-FR')}</p>` : ''}
            </div>

            <p>Vous trouverez la facture détaillée en pièce jointe au format PDF.</p>

            <p>Pour toute question concernant cette facture, n'hésitez pas à nous contacter.</p>

            <p>Cordialement,<br>${companyName}</p>
          </div>
          <div class="footer">
            <p>Ce message a été envoyé automatiquement via Craftly Ops</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
