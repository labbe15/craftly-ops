-- Add buying_price_ht and category to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS buying_price_ht numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS category text;
