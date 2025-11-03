// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderSchedule {
  id: string
  org_id: string
  name: string
  type: 'quote' | 'invoice'
  is_active: boolean
  days_after_sent?: number
  days_after_due?: number
  frequency: 'once' | 'daily' | 'weekly' | 'every_n_days'
  frequency_days?: number
  max_reminders: number
  email_subject?: string
  email_body?: string
  last_run_at?: string
  next_run_at?: string
}

interface Quote {
  id: string
  number: string
  client_id: string
  sent_at: string
  status: string
  totals_ttc: number
  client: {
    name: string
    email: string
  }
}

interface Invoice {
  id: string
  number: string
  client_id: string
  due_date: string
  status: string
  totals_ttc: number
  client: {
    name: string
    email: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date()
    console.log(`Processing reminders at ${now.toISOString()}`)

    // Fetch active schedules that need to run
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('reminder_schedules')
      .select('*')
      .eq('is_active', true)
      .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`)

    if (schedulesError) {
      throw schedulesError
    }

    console.log(`Found ${schedules?.length || 0} schedules to process`)

    let totalRemindersSent = 0

    // Process each schedule
    for (const schedule of schedules || []) {
      console.log(`Processing schedule: ${schedule.name} (${schedule.type})`)

      try {
        if (schedule.type === 'quote') {
          const remindersSent = await processQuoteSchedule(supabaseClient, schedule)
          totalRemindersSent += remindersSent
        } else if (schedule.type === 'invoice') {
          const remindersSent = await processInvoiceSchedule(supabaseClient, schedule)
          totalRemindersSent += remindersSent
        }

        // Update schedule's last_run_at and next_run_at
        const nextRun = calculateNextRun(schedule.frequency, schedule.frequency_days)
        await supabaseClient
          .from('reminder_schedules')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString()
          })
          .eq('id', schedule.id)

        console.log(`Schedule ${schedule.name} completed. Next run: ${nextRun.toISOString()}`)
      } catch (error) {
        console.error(`Error processing schedule ${schedule.name}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        schedulesProcessed: schedules?.length || 0,
        totalRemindersSent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function processQuoteSchedule(supabaseClient: any, schedule: ReminderSchedule): Promise<number> {
  // Find quotes that need reminders
  const daysAgo = new Date()
  daysAgo.setDate(daysAgo.getDate() - (schedule.days_after_sent || 7))

  const { data: quotes, error } = await supabaseClient
    .from('quotes')
    .select(`
      *,
      client:clients(name, email)
    `)
    .eq('status', 'sent')
    .lte('sent_at', daysAgo.toISOString())

  if (error) {
    console.error('Error fetching quotes:', error)
    return 0
  }

  let remindersSent = 0

  for (const quote of quotes || []) {
    // Check how many reminders already sent for this quote and schedule
    const { data: logs, error: logsError } = await supabaseClient
      .from('reminder_logs')
      .select('id')
      .eq('reminder_schedule_id', schedule.id)
      .eq('related_type', 'quote')
      .eq('related_id', quote.id)

    if (logsError) {
      console.error('Error checking reminder logs:', error)
      continue
    }

    // Skip if max reminders reached
    if (logs && logs.length >= schedule.max_reminders) {
      console.log(`Max reminders reached for quote ${quote.number}`)
      continue
    }

    // Check if client has email
    if (!quote.client?.email) {
      console.log(`Quote ${quote.number} has no client email, skipping`)
      continue
    }

    // Send reminder (integrate with your email service here)
    const subject = schedule.email_subject || `Relance concernant votre devis ${quote.number}`
    const body = schedule.email_body || `Bonjour,\n\nNous nous permettons de vous relancer concernant votre devis ${quote.number}.\n\nCordialement`

    console.log(`Sending reminder for quote ${quote.number} to ${quote.client.email}`)

    // Log in mail_log
    await supabaseClient.from('mail_log').insert({
      org_id: schedule.org_id,
      to_email: quote.client.email,
      subject,
      template_key: 'quote_reminder',
      related_type: 'quote',
      related_id: quote.id,
      status: 'sent',
      sent_at: new Date().toISOString()
    })

    // Log in reminder_logs
    await supabaseClient.from('reminder_logs').insert({
      reminder_schedule_id: schedule.id,
      related_type: 'quote',
      related_id: quote.id,
      recipient_email: quote.client.email,
      sent_at: new Date().toISOString(),
      success: true
    })

    remindersSent++
  }

  console.log(`Sent ${remindersSent} quote reminders for schedule ${schedule.name}`)
  return remindersSent
}

async function processInvoiceSchedule(supabaseClient: any, schedule: ReminderSchedule): Promise<number> {
  // Find invoices that are overdue
  const daysAgo = new Date()
  daysAgo.setDate(daysAgo.getDate() - (schedule.days_after_due || 0))

  const { data: invoices, error } = await supabaseClient
    .from('invoices')
    .select(`
      *,
      client:clients(name, email)
    `)
    .in('status', ['sent', 'overdue'])
    .lte('due_date', daysAgo.toISOString())

  if (error) {
    console.error('Error fetching invoices:', error)
    return 0
  }

  let remindersSent = 0

  for (const invoice of invoices || []) {
    // Check how many reminders already sent
    const { data: logs, error: logsError } = await supabaseClient
      .from('reminder_logs')
      .select('id')
      .eq('reminder_schedule_id', schedule.id)
      .eq('related_type', 'invoice')
      .eq('related_id', invoice.id)

    if (logsError) {
      console.error('Error checking reminder logs:', error)
      continue
    }

    // Skip if max reminders reached
    if (logs && logs.length >= schedule.max_reminders) {
      console.log(`Max reminders reached for invoice ${invoice.number}`)
      continue
    }

    // Check if client has email
    if (!invoice.client?.email) {
      console.log(`Invoice ${invoice.number} has no client email, skipping`)
      continue
    }

    // Send reminder
    const subject = schedule.email_subject || `Relance concernant votre facture ${invoice.number}`
    const body = schedule.email_body || `Bonjour,\n\nNous nous permettons de vous relancer concernant votre facture ${invoice.number} qui est échue.\n\nCordialement`

    console.log(`Sending reminder for invoice ${invoice.number} to ${invoice.client.email}`)

    // Log in mail_log
    await supabaseClient.from('mail_log').insert({
      org_id: schedule.org_id,
      to_email: invoice.client.email,
      subject,
      template_key: 'invoice_reminder',
      related_type: 'invoice',
      related_id: invoice.id,
      status: 'sent',
      sent_at: new Date().toISOString()
    })

    // Log in reminder_logs
    await supabaseClient.from('reminder_logs').insert({
      reminder_schedule_id: schedule.id,
      related_type: 'invoice',
      related_id: invoice.id,
      recipient_email: invoice.client.email,
      sent_at: new Date().toISOString(),
      success: true
    })

    remindersSent++
  }

  console.log(`Sent ${remindersSent} invoice reminders for schedule ${schedule.name}`)
  return remindersSent
}

function calculateNextRun(frequency: string, frequencyDays?: number): Date {
  const now = new Date()

  switch (frequency) {
    case 'once':
      // Set far in the future so it won't run again
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 10)
      return farFuture

    case 'daily':
      now.setDate(now.getDate() + 1)
      return now

    case 'weekly':
      now.setDate(now.getDate() + 7)
      return now

    case 'every_n_days':
      now.setDate(now.getDate() + (frequencyDays || 7))
      return now

    default:
      now.setDate(now.getDate() + 1)
      return now
  }
}

/* To invoke:
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-reminders' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
*/
