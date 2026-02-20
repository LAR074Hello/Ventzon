-- Add logo_url column to shops table for store logo storage
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS logo_url text;
