-- Migration 005: Hybrid Search RPC function
-- Combines pgvector ANN (semantic) + tsvector FTS (keyword) via Reciprocal Rank Fusion (RRF)
--
-- RRF Formula: score = Σ 1/(k + rank_i)  where k=60 (standard constant)
-- Weights: semantic_weight=0.7, keyword_weight=0.3 (tunable)
--
-- This runs as a single SQL call — no N+1 queries from the application layer.

CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_embedding   vector(768),          -- pre-computed by text-embedding-004 in app
  query_text        text,                 -- raw user query string for BM25
  match_count       int     DEFAULT 10,   -- how many results to return
  semantic_weight   float   DEFAULT 0.7,  -- weight for vector similarity leg
  keyword_weight    float   DEFAULT 0.3,  -- weight for FTS leg
  rrf_k             int     DEFAULT 60,   -- RRF constant (60 is standard)
  filter_category   text    DEFAULT NULL, -- optional: filter by category
  filter_gender     text    DEFAULT NULL, -- optional: filter by gender
  price_min         numeric DEFAULT NULL,
  price_max         numeric DEFAULT NULL
)
RETURNS TABLE (
  product_id        uuid,
  title             text,
  sku               text,
  price             numeric,
  category          text,
  tags              text[],
  image_urls        text[],
  stock_by_size     jsonb,
  colors            text[],
  sizes             text[],
  brand             text,
  description       text,
  material_composition text,
  rrf_score         float,               -- final fused relevance score
  semantic_rank     int,                 -- rank from vector leg (for debug)
  keyword_rank      int                  -- rank from FTS leg (for debug)
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- ── LEG 1: Semantic search via pgvector ANN (HNSW) ──────────────────
  semantic_results AS (
    SELECT
      p.id AS pid,
      ROW_NUMBER() OVER (ORDER BY pe.combined_embedding <=> query_embedding) AS rank
    FROM public.product_embeddings pe
    JOIN public.products p ON pe.product_id = p.id
    WHERE p.is_active = true
      AND pe.combined_embedding IS NOT NULL
      AND (filter_category IS NULL OR p.category = filter_category)
      AND (filter_gender   IS NULL OR p.gender   = filter_gender)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
    ORDER BY pe.combined_embedding <=> query_embedding
    LIMIT match_count * 4   -- over-fetch for RRF merging
  ),

  -- ── LEG 2: Keyword search via tsvector FTS (BM25-ranked) ────────────
  keyword_results AS (
    SELECT
      p.id AS pid,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(p.fts_document, websearch_to_tsquery('english', query_text)) DESC
      ) AS rank
    FROM public.products p
    WHERE p.is_active = true
      AND p.fts_document @@ websearch_to_tsquery('english', query_text)
      AND (filter_category IS NULL OR p.category = filter_category)
      AND (filter_gender   IS NULL OR p.gender   = filter_gender)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
    ORDER BY ts_rank_cd(p.fts_document, websearch_to_tsquery('english', query_text)) DESC
    LIMIT match_count * 4
  ),

  -- ── RRF Fusion ───────────────────────────────────────────────────────
  -- Union both result sets, compute weighted RRF score per product
  fused AS (
    SELECT
      COALESCE(s.pid, k.pid) AS pid,
      COALESCE(s.rank, 999999)::int   AS s_rank,
      COALESCE(k.rank, 999999)::int   AS k_rank,
      (semantic_weight * (1.0 / (rrf_k + COALESCE(s.rank, 999999)))) +
      (keyword_weight  * (1.0 / (rrf_k + COALESCE(k.rank, 999999)))) AS score
    FROM semantic_results s
    FULL OUTER JOIN keyword_results k ON s.pid = k.pid
  )

  -- ── Final join to get full product data ──────────────────────────────
  SELECT
    p.id,
    p.title,
    p.sku,
    p.price,
    p.category,
    p.tags,
    p.image_urls,
    p.stock_by_size,
    p.colors,
    p.sizes,
    p.brand,
    p.description,
    p.material_composition,
    f.score::float    AS rrf_score,
    f.s_rank          AS semantic_rank,
    f.k_rank          AS keyword_rank
  FROM fused f
  JOIN public.products p ON f.pid = p.id
  ORDER BY f.score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.hybrid_search TO authenticated;
GRANT EXECUTE ON FUNCTION public.hybrid_search TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- INVENTORY CHECK function
-- Returns real-time stock for a product (used by agent's checkInventory tool)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_inventory(p_sku text)
RETURNS TABLE (
  product_id    uuid,
  title         text,
  sku           text,
  stock_by_size jsonb,
  is_active     boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.sku, p.stock_by_size, p.is_active
  FROM public.products p
  WHERE p.sku = p_sku
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_inventory TO anon;
