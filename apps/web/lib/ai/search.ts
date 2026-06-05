import { createClient } from '@/lib/supabase/server'
import { generateTextEmbedding } from '@/lib/ai/embeddings'
import type { HybridSearchResult } from '@/lib/supabase/types'

export interface HybridSearchOptions {
  query: string
  matchCount?: number
  semanticWeight?: number
  keywordWeight?: number
  filterCategory?: string | null
  filterGender?: string | null
  priceMin?: number | null
  priceMax?: number | null
}

/**
 * Performs hybrid search combining pgvector ANN + Postgres tsvector FTS via RRF.
 * Executed as a single Supabase RPC call.
 */
export async function hybridSearch(
  options: HybridSearchOptions
): Promise<HybridSearchResult[]> {
  const {
    query,
    matchCount = 8,
    semanticWeight = 0.7,
    keywordWeight = 0.3,
    filterCategory = null,
    filterGender = null,
    priceMin = null,
    priceMax = null,
  } = options

  const supabase = await createClient()

  // Generate query embedding
  let queryEmbedding: number[]
  const activeSemanticWeight = semanticWeight
  const activeKeywordWeight = keywordWeight

  try {
    queryEmbedding = await generateTextEmbedding(query)
  } catch (err) {
    console.warn('[hybridSearch] Embedding API failed, falling back to keyword-only search:', err)
    return keywordOnlySearch({
      query,
      matchCount,
      filterCategory,
      filterGender,
      priceMin,
      priceMax,
    })
  }

  // Call the hybrid_search RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('hybrid_search', {
    query_embedding: queryEmbedding,
    query_text: query,
    match_count: matchCount,
    semantic_weight: activeSemanticWeight,
    keyword_weight: activeKeywordWeight,
    rrf_k: 60,
    filter_category: filterCategory,
    filter_gender: filterGender,
    price_min: priceMin,
    price_max: priceMax,
  })

  if (error) {
    console.error('[hybridSearch] RPC error:', error)
    // Secondary fallback: pure keyword query without RPC if RPC fails
    try {
      let q = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

      if (filterCategory) q = q.eq('category', filterCategory)
      if (filterGender) q = q.eq('gender', filterGender)
      if (priceMin !== null) q = q.gte('price', priceMin)
      if (priceMax !== null) q = q.lte('price', priceMax)

      // Basic text search on title / description / tags
      q = q.textSearch('fts_document', query, { config: 'english', type: 'websearch' })

      const { data: fallbackData, error: fallbackError } = await q.limit(matchCount)
      if (fallbackError) throw fallbackError

      return (fallbackData ?? []).map(
        (p): HybridSearchResult => ({
          product_id: p.id,
          title: p.title,
          sku: p.sku,
          price: p.price,
          category: p.category ?? '',
          tags: p.tags ?? [],
          image_urls: p.image_urls ?? [],
          stock_by_size: p.stock_by_size,
          colors: p.colors ?? [],
          sizes: p.sizes ?? [],
          brand: p.brand ?? '',
          description: p.description ?? '',
          material_composition: p.material_composition ?? '',
          rrf_score: 1.0,
          semantic_rank: 1,
          keyword_rank: 1,
        })
      )
    } catch (fallbackErr) {
      console.error('[hybridSearch] Secondary fallback search failed:', fallbackErr)
      throw new Error(`Hybrid search failed: ${error.message}`)
    }
  }

  return (data as HybridSearchResult[]) ?? []
}

/**
 * Keyword-only catalog search (used when embeddings are unavailable).
 * Avoids zero-vector semantic ranking, which returns the same products for every query.
 */
export async function keywordOnlySearch(options: {
  query: string
  matchCount?: number
  filterCategory?: string | null
  filterGender?: string | null
  priceMin?: number | null
  priceMax?: number | null
}): Promise<HybridSearchResult[]> {
  const {
    query,
    matchCount = 8,
    filterCategory = null,
    filterGender = null,
    priceMin = null,
    priceMax = null,
  } = options

  const supabase = await createClient()

  let q = supabase.from('products').select('*').eq('is_active', true)

  if (filterCategory) q = q.eq('category', filterCategory)
  if (filterGender) q = q.eq('gender', filterGender)
  if (priceMin !== null) q = q.gte('price', priceMin)
  if (priceMax !== null) q = q.lte('price', priceMax)

  q = q.textSearch('fts_document', query, { config: 'english', type: 'websearch' })

  const { data, error } = await q.limit(matchCount)

  if (error) {
    console.warn('[keywordOnlySearch] FTS failed, using ilike fallback:', error.message)
    const pattern = `%${query.split(/\s+/).slice(0, 4).join('%')}%`
    let fallback = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)

    if (filterCategory) fallback = fallback.eq('category', filterCategory)
    if (filterGender) fallback = fallback.eq('gender', filterGender)
    if (priceMin !== null) fallback = fallback.gte('price', priceMin)
    if (priceMax !== null) fallback = fallback.lte('price', priceMax)

    const { data: fallbackData, error: fallbackError } = await fallback.limit(matchCount)
    if (fallbackError) {
      console.error('[keywordOnlySearch] fallback error:', fallbackError)
      return []
    }
    return mapProductsToHybridResults(fallbackData ?? [])
  }

  return mapProductsToHybridResults(data ?? [])
}

function mapProductsToHybridResults(
  rows: Array<Record<string, unknown>>
): HybridSearchResult[] {
  return rows.map(
    (p): HybridSearchResult => ({
      product_id: p.id as string,
      title: p.title as string,
      sku: p.sku as string,
      price: p.price as number,
      category: (p.category as string) ?? '',
      tags: (p.tags as string[]) ?? [],
      image_urls: (p.image_urls as string[]) ?? [],
      stock_by_size: p.stock_by_size as Record<string, number>,
      colors: (p.colors as string[]) ?? [],
      sizes: (p.sizes as string[]) ?? [],
      brand: (p.brand as string) ?? '',
      description: (p.description as string) ?? '',
      material_composition: (p.material_composition as string) ?? '',
      rrf_score: 1.0,
      semantic_rank: 0,
      keyword_rank: 1,
    })
  )
}

/**
 * Checks real-time inventory for a SKU.
 */
export async function checkInventory(sku: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('check_inventory', { p_sku: sku })

  if (error) {
    console.error('[checkInventory] RPC error:', error)
    return null
  }

  return (data as Record<string, unknown>[])?.[0] ?? null
}

/**
 * Fetches featured products for the shop page.
 */
export async function getFeaturedProducts(limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getFeaturedProducts] error:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetches products with optional filters.
 */
export async function getProducts(options: {
  category?: string
  gender?: string
  limit?: number
  offset?: number
} = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (options.category) query = query.eq('category', options.category)
  if (options.gender) query = query.eq('gender', options.gender)

  const limit = options.limit ?? 20
  if (options.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1)
  } else {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getProducts] error:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetches a single product by ID.
 */
export async function getProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}
