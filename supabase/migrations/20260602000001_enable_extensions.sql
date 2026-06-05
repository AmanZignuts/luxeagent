-- Migration 001: Enable required Postgres extensions
-- pgvector for semantic search, pg_trgm for fuzzy text matching

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
