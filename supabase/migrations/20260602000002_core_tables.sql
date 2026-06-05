-- Migration 002: Core tables for LuxeAgent

-- ============================================================
-- PRODUCTS TABLE
-- Core fashion catalog. Vector status tracks embedding pipeline.
-- ============================================================
CREATE TABLE public.products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             text UNIQUE NOT NULL,
  title           text NOT NULL,
  description     text,
  price           numeric(10, 2) NOT NULL,
  original_price  numeric(10, 2),                     -- for sale/discount display
  material_composition text,
  category        text,                               -- 'dresses' | 'tops' | 'outerwear' | 'trousers' | 'accessories'
  sub_category    text,                               -- 'midi-dress' | 'blazer' | etc.
  gender          text DEFAULT 'women',               -- 'women' | 'men' | 'unisex'
  brand           text DEFAULT 'LuxeLabel',
  tags            text[] DEFAULT '{}',                -- ['minimalist', 'monochrome', 'silk', ...]
  sizes           text[] DEFAULT '{}',                -- ['XS','S','M','L','XL']
  colors          text[] DEFAULT '{}',                -- ['ivory', 'obsidian', 'champagne']
  image_urls      text[] DEFAULT '{}',                -- ordered array; first is primary
  stock_by_size   jsonb DEFAULT '{}',                 -- { "S": 10, "M": 5, "L": 0 }
  is_featured     boolean DEFAULT false,
  is_active       boolean DEFAULT true,
  vector_status   text DEFAULT 'PENDING'
                    CHECK (vector_status IN ('ACTIVE', 'PENDING', 'FAILED')),
  ai_metadata     jsonb DEFAULT '{}',                 -- raw Vision LLM output stored here
  seller_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCT EMBEDDINGS TABLE
-- text-embedding-004 produces 768-dimensional vectors.
-- Image embeddings: image → Gemini Vision description → text-embedding-004 → 768 dims
-- Combined: 0.6 * text_embedding + 0.4 * image_embedding
-- ============================================================
CREATE TABLE public.product_embeddings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  text_embedding      vector(768),        -- title + description + tags → text-embedding-004
  image_embedding     vector(768),        -- image → Gemini vision caption → text-embedding-004
  combined_embedding  vector(768),        -- weighted fusion (used for ANN search)
  content_hash        text,               -- sha256 of source text; used for dedup
  model_version       text DEFAULT 'text-embedding-004',
  created_at          timestamptz DEFAULT now(),
  UNIQUE(product_id)                      -- one embedding row per product
);

-- ============================================================
-- USER STYLE PROFILES TABLE
-- Created on onboarding completion. Drives personalized recs.
-- ============================================================
CREATE TABLE public.user_style_profiles (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          text,
  style_tokens          text[] DEFAULT '{}',  -- ['minimalist', 'editorial', 'monochrome']
  preferred_size        text,                 -- 'XS' | 'S' | 'M' | 'L' | 'XL'
  budget_min            numeric(10, 2) DEFAULT 0,
  budget_max            numeric(10, 2) DEFAULT 10000,
  preferred_colors      text[] DEFAULT '{}',
  preferred_categories  text[] DEFAULT '{}',
  onboarding_complete   boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ============================================================
-- ORDERS TABLE
-- Mock checkout: no payment processor. status drives the flow.
-- ============================================================
CREATE TABLE public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items             jsonb NOT NULL DEFAULT '[]',
  -- items structure: [{ product_id, sku, title, size, qty, unit_price, image_url }]
  subtotal          numeric(10, 2) NOT NULL DEFAULT 0,
  shipping_cost     numeric(10, 2) NOT NULL DEFAULT 0,
  total             numeric(10, 2) NOT NULL DEFAULT 0,
  status            text DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  shipping_address  jsonb DEFAULT '{}',
  -- shipping_address: { name, street, city, state, zip, country }
  tracking_number   text,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- CHAT SESSIONS TABLE
-- Persists concierge conversation history per user session.
-- ============================================================
CREATE TABLE public.chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text DEFAULT 'New Conversation',
  messages    jsonb DEFAULT '[]',
  -- messages: [{ role: 'user'|'assistant', content, timestamp, tool_calls? }]
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Auto-updates updated_at on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_user_style_profiles_updated_at
  BEFORE UPDATE ON public.user_style_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
