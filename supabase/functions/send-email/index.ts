import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, attachments, org_id } = await req.json();

    // Validate input
    if (!to || !subject || !html || !org_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html, org_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch org settings to check for SMTP config
    const { data: orgSettings, error: orgError } = await supabase
      .from("org_settings")
      .select("smtp_host, smtp_port, smtp_user, smtp_password, email_from_address, email_sender_name")
      .eq("org_id", org_id)
      .single();

    if (orgError) {
      console.error("Error fetching org settings:", orgError);
    }

    // Check if SMTP is configured
    if (orgSettings?.smtp_host && orgSettings?.smtp_user && orgSettings?.smtp_password) {
      console.log("Using custom SMTP for org:", org_id);

      const transporter = nodemailer.createTransport({
        host: orgSettings.smtp_host,
        port: orgSettings.smtp_port || 587,
        secure: orgSettings.smtp_port === 465, // true for 465, false for other ports
        auth: {
          user: orgSettings.smtp_user,
          pass: orgSettings.smtp_password,
        },
      });

      const fromName = orgSettings.email_sender_name || "Craftly Ops";
      const fromEmail = orgSettings.email_from_address || orgSettings.smtp_user;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        attachments: attachments?.map((a: any) => ({
          filename: a.filename,
          content: a.content,
          encoding: 'base64'
        })),
      });

      return new Response(JSON.stringify({ success: true, method: "smtp" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to Resend
    console.log("Using Resend fallback for org:", org_id);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set and no SMTP configured");
    }

    const resend = new Resend(resendApiKey);

    const data = await resend.emails.send({
      from: "Craftly Ops <onboarding@resend.dev>", // Update with your verified domain
      to,
      subject,
      html,
      attachments,
    });

    return new Response(JSON.stringify({ ...data, method: "resend" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
