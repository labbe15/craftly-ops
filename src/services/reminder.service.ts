// Reminder Service for Craftly Ops
// Handles automatic reminders for quotes and invoices

import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface ReminderEmailData {
  to: string;
  toName: string;
  subject: string;
  body: string;
  documentType: "quote" | "invoice";
  documentNumber: string;
  documentId: string;
}

class ReminderService {
  // Generate quote follow-up email
  generateQuoteFollowup(quote: any, client: any, orgSettings: any): ReminderEmailData {
    const subject = `Relance - Devis ${quote.number}`;

    const body = `
Bonjour ${client.contact_name || client.name},

Nous vous avons transmis le devis ${quote.number} le ${format(new Date(quote.created_at), "dd MMMM yyyy", { locale: fr })}.

N'ayant pas eu de retour de votre part, nous nous permettons de revenir vers vous afin de savoir si ce devis correspond à vos attentes.

**Détails du devis :**
- Numéro : ${quote.number}
- Montant : ${quote.totals_ttc.toFixed(2)} € TTC
${quote.expires_at ? `- Valable jusqu'au : ${format(new Date(quote.expires_at), "dd MMMM yyyy", { locale: fr })}` : ""}

Nous restons à votre disposition pour toute question ou modification éventuelle.

Dans l'attente de votre retour,

Cordialement,

${orgSettings?.company_name || ""}
${orgSettings?.phone || ""}
${orgSettings?.email_from_address || ""}
    `.trim();

    return {
      to: client.email,
      toName: client.contact_name || client.name,
      subject,
      body,
      documentType: "quote",
      documentNumber: quote.number,
      documentId: quote.id,
    };
  }

  // Generate invoice payment reminder
  generateInvoiceReminder(invoice: any, client: any, orgSettings: any, isOverdue: boolean = false): ReminderEmailData {
    const subject = isOverdue
      ? `Relance - Facture impayée ${invoice.number}`
      : `Rappel - Facture ${invoice.number} à régler`;

    const body = `
Bonjour ${client.contact_name || client.name},

${
  isOverdue
    ? `Nous constatons que la facture ${invoice.number} n'a pas encore été réglée malgré le dépassement de son échéance.`
    : `Nous vous rappelons que la facture ${invoice.number} arrive à échéance prochainement.`
}

**Détails de la facture :**
- Numéro : ${invoice.number}
- Date d'émission : ${format(new Date(invoice.created_at), "dd MMMM yyyy", { locale: fr })}
${invoice.due_date ? `- Date d'échéance : ${format(new Date(invoice.due_date), "dd MMMM yyyy", { locale: fr })}` : ""}
- Montant à régler : ${invoice.totals_ttc.toFixed(2)} € TTC

${
  isOverdue
    ? `Nous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.\n\nNous vous rappelons qu'en cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront applicables, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€.`
    : `Nous vous remercions de bien vouloir procéder au règlement avant la date d'échéance.`
}

**Modalités de paiement :**
Merci de mentionner la référence ${invoice.number} lors de votre règlement.

Pour toute question concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,

${orgSettings?.company_name || ""}
${orgSettings?.phone || ""}
${orgSettings?.email_from_address || ""}
    `.trim();

    return {
      to: client.email,
      toName: client.contact_name || client.name,
      subject,
      body,
      documentType: "invoice",
      documentNumber: invoice.number,
      documentId: invoice.id,
    };
  }

  // Send reminder email (would integrate with real email service)
  async sendReminderEmail(emailData: ReminderEmailData): Promise<boolean> {
    try {
      // In production, this would call an actual email service (Resend, SendGrid, etc.)
      // For now, we'll log the reminder in the database

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Log the reminder in activity_logs
      const { error: logError } = await supabase.from("activity_logs").insert({
        org_id: user.id,
        action: "reminder_sent",
        entity_type: emailData.documentType,
        entity_id: emailData.documentId,
        details: {
          to: emailData.to,
          subject: emailData.subject,
          document_number: emailData.documentNumber,
        },
      });

      if (logError) throw logError;

      // TODO: Integrate with actual email service
      // Example with Resend:
      // await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     from: orgSettings.email_from_address,
      //     to: emailData.to,
      //     subject: emailData.subject,
      //     text: emailData.body
      //   })
      // });

      console.log("📧 Reminder email queued:", emailData.subject, "to", emailData.to);
      return true;
    } catch (error) {
      console.error("Error sending reminder:", error);
      return false;
    }
  }

  // Find quotes that need follow-up
  async findQuotesNeedingFollowup(orgSettings: any): Promise<any[]> {
    const followupDays = orgSettings?.quote_followup_days || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - followupDays);

    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("*, clients(id, name, contact_name, email)")
      .eq("status", "sent")
      .lt("created_at", cutoffDate.toISOString())
      .is("followed_up_at", null);

    if (error) {
      console.error("Error finding quotes:", error);
      return [];
    }

    return quotes || [];
  }

  // Find invoices that are overdue
  async findOverdueInvoices(orgSettings: any): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0];

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*, clients(id, name, contact_name, email)")
      .in("status", ["sent", "overdue"])
      .lt("due_date", today);

    if (error) {
      console.error("Error finding overdue invoices:", error);
      return [];
    }

    return invoices || [];
  }

  // Find invoices approaching due date
  async findInvoicesNearingDueDate(orgSettings: any): Promise<any[]> {
    const reminderDays = 3; // Remind 3 days before due date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + reminderDays);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*, clients(id, name, contact_name, email)")
      .eq("status", "sent")
      .eq("due_date", targetDateStr);

    if (error) {
      console.error("Error finding invoices nearing due date:", error);
      return [];
    }

    return invoices || [];
  }

  // Process all pending reminders
  async processAllReminders(orgSettings: any) {
    const results = {
      quotesFollowedUp: 0,
      invoicesReminded: 0,
      invoicesOverdue: 0,
      errors: [] as string[],
    };

    // Process quote follow-ups
    const quotesNeedingFollowup = await this.findQuotesNeedingFollowup(orgSettings);
    for (const quote of quotesNeedingFollowup) {
      if (!quote.clients?.email) {
        results.errors.push(`Quote ${quote.number}: No email for client`);
        continue;
      }

      const emailData = this.generateQuoteFollowup(quote, quote.clients, orgSettings);
      const sent = await this.sendReminderEmail(emailData);

      if (sent) {
        // Mark as followed up
        await supabase
          .from("quotes")
          .update({ followed_up_at: new Date().toISOString() })
          .eq("id", quote.id);

        results.quotesFollowedUp++;
      } else {
        results.errors.push(`Failed to send reminder for quote ${quote.number}`);
      }
    }

    // Process overdue invoices
    const overdueInvoices = await this.findOverdueInvoices(orgSettings);
    for (const invoice of overdueInvoices) {
      if (!invoice.clients?.email) {
        results.errors.push(`Invoice ${invoice.number}: No email for client`);
        continue;
      }

      const emailData = this.generateInvoiceReminder(invoice, invoice.clients, orgSettings, true);
      const sent = await this.sendReminderEmail(emailData);

      if (sent) {
        // Update status to overdue if not already
        if (invoice.status !== "overdue") {
          await supabase
            .from("invoices")
            .update({ status: "overdue" })
            .eq("id", invoice.id);
        }

        results.invoicesOverdue++;
      } else {
        results.errors.push(`Failed to send overdue reminder for invoice ${invoice.number}`);
      }
    }

    // Process invoices nearing due date
    const invoicesNearingDue = await this.findInvoicesNearingDueDate(orgSettings);
    for (const invoice of invoicesNearingDue) {
      if (!invoice.clients?.email) {
        results.errors.push(`Invoice ${invoice.number}: No email for client`);
        continue;
      }

      const emailData = this.generateInvoiceReminder(invoice, invoice.clients, orgSettings, false);
      const sent = await this.sendReminderEmail(emailData);

      if (sent) {
        results.invoicesReminded++;
      } else {
        results.errors.push(`Failed to send reminder for invoice ${invoice.number}`);
      }
    }

    return results;
  }
}

export const reminderService = new ReminderService();
