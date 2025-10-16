-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create org_settings table (single row per organization)
CREATE TABLE IF NOT EXISTS public.org_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  vat_number TEXT,
  address TEXT,
  phone TEXT,
  brand_primary TEXT DEFAULT '#3b82f6',
  brand_secondary TEXT DEFAULT '#1e40af',
  font TEXT DEFAULT 'Inter',
  header_bg_url TEXT,
  footer_text TEXT,
  email_from_address TEXT,
  email_sender_name TEXT,
  quote_prefix TEXT DEFAULT 'DEV-',
  invoice_prefix TEXT DEFAULT 'FACT-',
  default_vat_rate NUMERIC(5,2) DEFAULT 20.00,
  payment_terms_days INTEGER DEFAULT 30,
  quote_followup_days INTEGER DEFAULT 7,
  invoice_overdue_days INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items (articles/prestations) table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  unit TEXT DEFAULT 'u',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'refused', 'expired')),
  currency TEXT DEFAULT 'EUR',
  expires_at TIMESTAMPTZ,
  terms_text TEXT,
  notes TEXT,
  totals_ht NUMERIC(10,2) DEFAULT 0,
  totals_vat NUMERIC(10,2) DEFAULT 0,
  totals_ttc NUMERIC(10,2) DEFAULT 0,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  refused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quote_items table
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'u',
  unit_price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  line_total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  currency TEXT DEFAULT 'EUR',
  due_date TIMESTAMPTZ,
  totals_ht NUMERIC(10,2) DEFAULT 0,
  totals_vat NUMERIC(10,2) DEFAULT 0,
  totals_ttc NUMERIC(10,2) DEFAULT 0,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'u',
  unit_price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  line_total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events (agenda) table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mail_log table
CREATE TABLE IF NOT EXISTS public.mail_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_key TEXT,
  related_type TEXT CHECK (related_type IN ('quote', 'invoice')),
  related_id UUID,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  related_type TEXT,
  related_id UUID,
  kind TEXT CHECK (kind IN ('pdf', 'logo', 'banner')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies (filtered by org_id for multi-tenant)
-- org_settings policies
CREATE POLICY "Users can view their org settings"
  ON public.org_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their org settings"
  ON public.org_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their org settings"
  ON public.org_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- clients policies
CREATE POLICY "Users can view their clients"
  ON public.clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their clients"
  ON public.clients FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- items policies
CREATE POLICY "Users can view their items"
  ON public.items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their items"
  ON public.items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their items"
  ON public.items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- quotes policies
CREATE POLICY "Users can view their quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their quotes"
  ON public.quotes FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- quote_items policies
CREATE POLICY "Users can view quote items"
  ON public.quote_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update quote items"
  ON public.quote_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete quote items"
  ON public.quote_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- invoices policies
CREATE POLICY "Users can view their invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- invoice_items policies
CREATE POLICY "Users can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- payments policies
CREATE POLICY "Users can view payments"
  ON public.payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete payments"
  ON public.payments FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- events policies
CREATE POLICY "Users can view their events"
  ON public.events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- mail_log policies
CREATE POLICY "Users can view mail logs"
  ON public.mail_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert mail logs"
  ON public.mail_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- files policies
CREATE POLICY "Users can view files"
  ON public.files FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete files"
  ON public.files FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON public.org_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();