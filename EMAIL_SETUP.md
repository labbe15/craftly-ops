# Email Configuration Guide

This guide explains how to set up email sending functionality using Resend.

## Prerequisites

1. **Resend Account**: Sign up at [https://resend.com](https://resend.com)
2. **Supabase CLI**: Install from [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

## Step 1: Get Resend API Key

1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy the API key (you'll only see it once)

## Step 2: Configure Domain (Optional but Recommended)

By default, emails will be sent from `onboarding@resend.dev`. For production:

1. Add your domain in Resend dashboard
2. Add DNS records to verify your domain
3. Update the `from` address in `/supabase/functions/send-email/index.ts`:
   ```typescript
   from: "Your Company <noreply@yourdomain.com>",
   ```

## Step 3: Deploy Edge Function

1. Link your Supabase project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. Set the Resend API key as a secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

3. Deploy the edge function:
   ```bash
   supabase functions deploy send-email
   ```

4. Verify the deployment:
   ```bash
   supabase functions list
   ```

## Step 4: Test Email Sending

1. Make sure you have configured your organization settings:
   - Go to Settings page
   - Fill in company information
   - Add email configuration

2. Create a quote or invoice with a client that has an email address

3. Click "Envoyer par email" (Send by email) button

4. Fill in the email details and send

5. Check the mail_log table to verify the email was logged:
   ```sql
   SELECT * FROM mail_log ORDER BY created_at DESC LIMIT 10;
   ```

## Troubleshooting

### Email not sending

1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs send-email
   ```

2. Verify the RESEND_API_KEY secret is set:
   ```bash
   supabase secrets list
   ```

3. Check that the edge function is deployed:
   ```bash
   supabase functions list
   ```

### Email marked as failed in mail_log

1. Check the browser console for errors
2. Verify client has a valid email address
3. Check Supabase Edge Function logs for detailed error messages

## Email Templates

Email templates are defined in `/src/services/emailService.ts`:

- `generateQuoteEmailHTML`: Template for quote emails
- `generateInvoiceEmailHTML`: Template for invoice emails

You can customize these templates to match your branding and messaging.

## Local Development

For local development:

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Set the Resend API key locally:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here --local
   ```

3. Serve the edge function locally:
   ```bash
   supabase functions serve send-email
   ```

## Security Notes

- The Resend API key is stored as a Supabase secret (server-side only)
- It's never exposed to the client
- All email sending happens through the Edge Function
- Email logs are tracked in the `mail_log` table for audit purposes
