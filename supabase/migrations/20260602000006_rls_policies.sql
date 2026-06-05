-- Migration 006: Row Level Security (RLS) Policies
-- Ensures users can only read/write their own data

-- ── Enable RLS on all tables ──────────────────────────────────────────
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions      ENABLE ROW LEVEL SECURITY;

-- ── PRODUCTS: Public read, seller write ──────────────────────────────
-- Anyone (including anon) can read active products
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Sellers can insert their own products
CREATE POLICY "products_seller_insert"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update/delete their own products
CREATE POLICY "products_seller_update"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "products_seller_delete"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id);

-- Service role can do everything (for ingest pipeline)
CREATE POLICY "products_service_role_all"
  ON public.products FOR ALL
  USING (auth.role() = 'service_role');

-- ── PRODUCT EMBEDDINGS: Public read, service role write ──────────────
CREATE POLICY "embeddings_public_read"
  ON public.product_embeddings FOR SELECT
  USING (true);

CREATE POLICY "embeddings_service_role_all"
  ON public.product_embeddings FOR ALL
  USING (auth.role() = 'service_role');

-- ── USER STYLE PROFILES: Own profile only ────────────────────────────
CREATE POLICY "style_profiles_own_read"
  ON public.user_style_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "style_profiles_own_write"
  ON public.user_style_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "style_profiles_own_update"
  ON public.user_style_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ── ORDERS: Own orders only ───────────────────────────────────────────
CREATE POLICY "orders_own_read"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_own_insert"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sellers can see orders containing their products (service role)
CREATE POLICY "orders_service_role_all"
  ON public.orders FOR ALL
  USING (auth.role() = 'service_role');

-- ── CHAT SESSIONS: Own sessions only ─────────────────────────────────
CREATE POLICY "chat_own_read"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_own_write"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_own_update"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "chat_own_delete"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);
