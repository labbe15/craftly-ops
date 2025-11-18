-- Add PDF template columns to org_settings
ALTER TABLE IF EXISTS public.org_settings
ADD COLUMN IF NOT EXISTS default_quote_template TEXT DEFAULT 'quote-modern',
ADD COLUMN IF NOT EXISTS default_invoice_template TEXT DEFAULT 'invoice-modern';

-- Add comment
COMMENT ON COLUMN public.org_settings.default_quote_template IS 'ID du template PDF par défaut pour les devis (quote-modern, quote-classic, quote-minimal)';
COMMENT ON COLUMN public.org_settings.default_invoice_template IS 'ID du template PDF par défaut pour les factures (invoice-modern, invoice-classic, invoice-minimal)';
