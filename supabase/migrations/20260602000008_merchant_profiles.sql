-- Migration 008: Merchant profiles table and RLS policies

CREATE TABLE IF NOT EXISTS public.merchant_profiles (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name        text NOT NULL,
  store_email       text,
  business_address  text,
  phone             text,
  tax_id            text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "merchant_profiles_own_read"
  ON public.merchant_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "merchant_profiles_own_write"
  ON public.merchant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merchant_profiles_own_update"
  ON public.merchant_profiles FOR UPDATE
  USING (auth.uid() = user_id);
