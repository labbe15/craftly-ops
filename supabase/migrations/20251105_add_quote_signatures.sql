-- Add signature fields to quotes table
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS signature_url TEXT,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by_name TEXT,
  ADD COLUMN IF NOT EXISTS signed_by_email TEXT;

-- Update the status CHECK constraint to include 'signed'
ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'sent', 'accepted', 'refused', 'expired', 'signed'));

-- Create storage bucket for signatures if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for authenticated users to upload signatures
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

-- Create storage policy for public read access to signatures
CREATE POLICY "Public read access to signatures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signatures');

-- Create storage policy for authenticated users to delete their signatures
CREATE POLICY "Authenticated users can delete signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures');
