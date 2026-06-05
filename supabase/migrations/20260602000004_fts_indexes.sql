-- Migration 004: Full-Text Search (FTS) infrastructure
-- Postgres tsvector for BM25-style keyword matching (the "B" in Hybrid Search)

-- Add a plain tsvector column to products for fast FTS
ALTER TABLE public.products ADD COLUMN fts_document tsvector;

-- Create function to update fts_document
CREATE OR REPLACE FUNCTION products_update_fts()
RETURNS trigger AS $$
BEGIN
  NEW.fts_document :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.sub_category, '') || ' ' || coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.material_composition, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the function before insert or update
CREATE TRIGGER trg_products_update_fts
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION products_update_fts();

-- GIN index for fast tsvector queries
CREATE INDEX idx_products_fts ON public.products USING gin(fts_document);

-- pg_trgm index for fuzzy LIKE/ILIKE queries (typo tolerance)
CREATE INDEX idx_products_title_trgm ON public.products USING gin(title gin_trgm_ops);
CREATE INDEX idx_products_tags ON public.products USING gin(tags);


