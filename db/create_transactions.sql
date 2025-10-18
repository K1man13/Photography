-- SQL: create transactions table for Supabase/Postgres
-- Run this in your Supabase SQL editor or psql

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  received_at timestamptz DEFAULT now(),
  raw jsonb,
  summary jsonb
);

-- Optional index for quick lookups
CREATE INDEX IF NOT EXISTS idx_transactions_received_at ON public.transactions (received_at DESC);
