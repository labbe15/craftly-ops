-- Add type column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('professional', 'individual')) DEFAULT 'professional';
