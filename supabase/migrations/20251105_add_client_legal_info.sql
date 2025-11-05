-- Add legal information fields to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS siret VARCHAR(14),
  ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS legal_form VARCHAR(100),
  ADD COLUMN IF NOT EXISTS registration_city VARCHAR(255);

-- Add index on SIRET for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_siret ON public.clients(siret);

-- Add comment
COMMENT ON COLUMN public.clients.siret IS 'Numéro SIRET de l''entreprise (14 chiffres)';
COMMENT ON COLUMN public.clients.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN public.clients.legal_form IS 'Forme juridique (SARL, SAS, EI, etc.)';
COMMENT ON COLUMN public.clients.registration_city IS 'Ville d''immatriculation RCS';
