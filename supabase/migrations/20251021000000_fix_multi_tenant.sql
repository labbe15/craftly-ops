-- Create user_organizations table to link users to their organizations
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Enable RLS on user_organizations
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Policy for user_organizations
CREATE POLICY "Users can view their own organizations"
  ON public.user_organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organizations"
  ON public.user_organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create helper function to get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.user_organizations
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Drop existing policies and recreate them with org_id filtering

-- org_settings policies
DROP POLICY IF EXISTS "Users can view their org settings" ON public.org_settings;
DROP POLICY IF EXISTS "Users can update their org settings" ON public.org_settings;
DROP POLICY IF EXISTS "Users can insert their org settings" ON public.org_settings;

CREATE POLICY "Users can view their org settings"
  ON public.org_settings FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can update their org settings"
  ON public.org_settings FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert their org settings"
  ON public.org_settings FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

-- clients policies
DROP POLICY IF EXISTS "Users can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their clients" ON public.clients;

CREATE POLICY "Users can view their clients"
  ON public.clients FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update their clients"
  ON public.clients FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete their clients"
  ON public.clients FOR DELETE
  USING (org_id = get_user_org_id());

-- items policies
DROP POLICY IF EXISTS "Users can view their items" ON public.items;
DROP POLICY IF EXISTS "Users can insert items" ON public.items;
DROP POLICY IF EXISTS "Users can update their items" ON public.items;
DROP POLICY IF EXISTS "Users can delete their items" ON public.items;

CREATE POLICY "Users can view their items"
  ON public.items FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert items"
  ON public.items FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update their items"
  ON public.items FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete their items"
  ON public.items FOR DELETE
  USING (org_id = get_user_org_id());

-- quotes policies
DROP POLICY IF EXISTS "Users can view their quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their quotes" ON public.quotes;

CREATE POLICY "Users can view their quotes"
  ON public.quotes FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update their quotes"
  ON public.quotes FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete their quotes"
  ON public.quotes FOR DELETE
  USING (org_id = get_user_org_id());

-- quote_items policies (via quote relationship)
DROP POLICY IF EXISTS "Users can view quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete quote items" ON public.quote_items;

CREATE POLICY "Users can view quote items"
  ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can insert quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can update quote items"
  ON public.quote_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can delete quote items"
  ON public.quote_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.org_id = get_user_org_id()
  ));

-- invoices policies
DROP POLICY IF EXISTS "Users can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their invoices" ON public.invoices;

CREATE POLICY "Users can view their invoices"
  ON public.invoices FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update their invoices"
  ON public.invoices FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete their invoices"
  ON public.invoices FOR DELETE
  USING (org_id = get_user_org_id());

-- invoice_items policies (via invoice relationship)
DROP POLICY IF EXISTS "Users can view invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items" ON public.invoice_items;

CREATE POLICY "Users can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can insert invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

-- payments policies (via invoice relationship)
DROP POLICY IF EXISTS "Users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete payments" ON public.payments;

CREATE POLICY "Users can view payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = payments.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = payments.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can update payments"
  ON public.payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = payments.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

CREATE POLICY "Users can delete payments"
  ON public.payments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = payments.invoice_id
    AND invoices.org_id = get_user_org_id()
  ));

-- events policies
DROP POLICY IF EXISTS "Users can view their events" ON public.events;
DROP POLICY IF EXISTS "Users can insert events" ON public.events;
DROP POLICY IF EXISTS "Users can update their events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their events" ON public.events;

CREATE POLICY "Users can view their events"
  ON public.events FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert events"
  ON public.events FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update their events"
  ON public.events FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete their events"
  ON public.events FOR DELETE
  USING (org_id = get_user_org_id());

-- mail_log policies
DROP POLICY IF EXISTS "Users can view mail logs" ON public.mail_log;
DROP POLICY IF EXISTS "Users can insert mail logs" ON public.mail_log;

CREATE POLICY "Users can view mail logs"
  ON public.mail_log FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert mail logs"
  ON public.mail_log FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

-- files policies
DROP POLICY IF EXISTS "Users can view files" ON public.files;
DROP POLICY IF EXISTS "Users can insert files" ON public.files;
DROP POLICY IF EXISTS "Users can delete files" ON public.files;

CREATE POLICY "Users can view files"
  ON public.files FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert files"
  ON public.files FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can delete files"
  ON public.files FOR DELETE
  USING (org_id = get_user_org_id());

-- Create a trigger to automatically create an organization for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization
  new_org_id := uuid_generate_v4();

  -- Link the user to the new organization
  INSERT INTO public.user_organizations (user_id, org_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  -- Create default org settings
  INSERT INTO public.org_settings (org_id)
  VALUES (new_org_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
