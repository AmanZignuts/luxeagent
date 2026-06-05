-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/heypbaixqetfdktdicyv/sql/new

CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_last4          text NOT NULL,
  card_brand          text DEFAULT 'Visa',
  card_name           text NOT NULL,
  card_expiry         text NOT NULL,
  card_number_masked  text NOT NULL,
  is_default          boolean DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE OR REPLACE TRIGGER trg_user_payment_methods_updated_at
  BEFORE UPDATE ON public.user_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_payment_methods' AND policyname = 'payment_methods_own_read'
  ) THEN
    CREATE POLICY "payment_methods_own_read"
      ON public.user_payment_methods FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_payment_methods' AND policyname = 'payment_methods_own_insert'
  ) THEN
    CREATE POLICY "payment_methods_own_insert"
      ON public.user_payment_methods FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_payment_methods' AND policyname = 'payment_methods_own_update'
  ) THEN
    CREATE POLICY "payment_methods_own_update"
      ON public.user_payment_methods FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_payment_methods' AND policyname = 'payment_methods_own_delete'
  ) THEN
    CREATE POLICY "payment_methods_own_delete"
      ON public.user_payment_methods FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_payment_methods TO authenticated;
