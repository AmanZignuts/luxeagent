-- Migration 003: HNSW index on combined_embedding + standard B-tree indexes
-- HNSW (Hierarchical Navigable Small World) gives O(log n) ANN search
-- m=16: max connections per node (quality/speed tradeoff)
-- ef_construction=64: beam width during index build (higher = better recall, slower build)

-- Primary ANN search index (cosine similarity)
CREATE INDEX idx_product_embeddings_combined_hnsw
  ON public.product_embeddings
  USING hnsw (combined_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Also index text and image separately for targeted queries
CREATE INDEX idx_product_embeddings_text_hnsw
  ON public.product_embeddings
  USING hnsw (text_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Standard indexes for common query patterns
CREATE INDEX idx_products_category ON public.products (category);
CREATE INDEX idx_products_gender ON public.products (gender);
CREATE INDEX idx_products_vector_status ON public.products (vector_status);
CREATE INDEX idx_products_is_active ON public.products (is_active);
CREATE INDEX idx_products_is_featured ON public.products (is_featured);
CREATE INDEX idx_products_price ON public.products (price);
CREATE INDEX idx_orders_user_id ON public.orders (user_id);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions (user_id);
