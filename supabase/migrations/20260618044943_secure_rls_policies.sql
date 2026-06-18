-- Secure RLS Policies Update
-- Fix UPDATE policies lacking WITH CHECK clauses, and migrate auth.role() checks to TO clause.

-- Products Update
DROP POLICY IF EXISTS "products_seller_update" ON public.products;
CREATE POLICY "products_seller_update"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id OR seller_id IS NULL)
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "products_seller_select" ON public.products;
CREATE POLICY "products_seller_select"
  ON public.products FOR SELECT
  USING (auth.uid() = seller_id OR seller_id IS NULL);

DROP POLICY IF EXISTS "products_service_role_all" ON public.products;
CREATE POLICY "products_service_role_all"
  ON public.products FOR ALL
  TO service_role
  USING (true);

-- Product Embeddings
DROP POLICY IF EXISTS "embeddings_service_role_all" ON public.product_embeddings;
CREATE POLICY "embeddings_service_role_all"
  ON public.product_embeddings FOR ALL
  TO service_role
  USING (true);

-- User Style Profiles
DROP POLICY IF EXISTS "style_profiles_own_update" ON public.user_style_profiles;
CREATE POLICY "style_profiles_own_update"
  ON public.user_style_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders
DROP POLICY IF EXISTS "orders_service_role_all" ON public.orders;
CREATE POLICY "orders_service_role_all"
  ON public.orders FOR ALL
  TO service_role
  USING (true);

-- Chat Sessions
DROP POLICY IF EXISTS "chat_own_update" ON public.chat_sessions;
CREATE POLICY "chat_own_update"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Merchant Profiles
DROP POLICY IF EXISTS "merchant_profiles_own_update" ON public.merchant_profiles;
CREATE POLICY "merchant_profiles_own_update"
  ON public.merchant_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Explicit API grants for core tables (required when auto_expose_new_tables is false)
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT SELECT ON public.product_embeddings TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_style_profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_profiles TO authenticated;

