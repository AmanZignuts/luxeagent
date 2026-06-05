import { createClient } from '@/lib/supabase/server'
import type { HybridSearchResult } from '@/lib/supabase/types'
import { hybridSearch } from '@/lib/ai/search'
import { isTrustedCatalogProduct } from '@/lib/ai/occasion-search'
import {
  type CatalogSearchFilters,
  hasHardFilters,
  productMatchesFilters,
  scoreQueryRelevance,
  describeAppliedFilters,
} from '@/lib/ai/search-constraints'

function mapRow(p: Record<string, unknown>): HybridSearchResult {
  return {
    product_id: p.id as string,
    title: p.title as string,
    sku: p.sku as string,
    price: Number(p.price),
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
  }
}

/** DB-only product fetch with hard filters (category, price, gender). */
export async function fetchFilteredCatalog(
  filters: CatalogSearchFilters
): Promise<HybridSearchResult[]> {
  const supabase = await createClient()
  let q = supabase.from('products').select('*').eq('is_active', true)

  if (filters.category) q = q.eq('category', filters.category)
  if (filters.gender) q = q.eq('gender', filters.gender)
  if (filters.priceMin !== null) q = q.gte('price', filters.priceMin)
  if (filters.priceMax !== null) q = q.lte('price', filters.priceMax)

  const { data, error } = await q.order('price', { ascending: true })

  if (error) {
    console.error('[catalog-search] DB filter error:', error)
    return []
  }

  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((p) => isTrustedCatalogProduct(p) && productMatchesFilters(p, filters))
}

async function getLowestPriceInCategory(category: string): Promise<number | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('price')
    .eq('is_active', true)
    .eq('category', category)
    .order('price', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.price != null ? Number(data.price) : null
}

export function buildEmptySearchMessage(
  filters: CatalogSearchFilters,
  lowestInCategory: number | null
): string {
  const criteria = describeAppliedFilters(filters)

  if (filters.category && filters.priceMax !== null && lowestInCategory !== null) {
    if (lowestInCategory > filters.priceMax) {
      return `Nothing in our catalog matches ${criteria}. Our ${filters.category} start at ₹${lowestInCategory.toLocaleString('en-IN')}. Try raising your budget or browsing another category.`
    }
  }

  return `No pieces in our catalog match ${criteria} exactly. Try adjusting category, budget, or style keywords.`
}

export type StrictCatalogSearchResult = {
  products: HybridSearchResult[]
  empty: boolean
  emptyMessage?: string
  appliedFilters: CatalogSearchFilters
}

/**
 * Strict catalog search: hard DB filters first, never pad with unrelated products.
 * Falls back to hybrid search only when the user did not specify category/price/gender.
 */
export async function strictCatalogSearch(
  filters: CatalogSearchFilters,
  count = 6
): Promise<StrictCatalogSearchResult> {
  const hard = hasHardFilters(filters)

  if (hard) {
    const candidates = await fetchFilteredCatalog(filters)

    if (candidates.length === 0) {
      const lowest =
        filters.category != null
          ? await getLowestPriceInCategory(filters.category)
          : null
      return {
        products: [],
        empty: true,
        emptyMessage: buildEmptySearchMessage(filters, lowest),
        appliedFilters: filters,
      }
    }

    const ranked = [...candidates].sort((a, b) => {
      const rel = scoreQueryRelevance(b, filters.query) - scoreQueryRelevance(a, filters.query)
      if (rel !== 0) return rel
      return (a.price ?? 0) - (b.price ?? 0)
    })

    const withRelevance = ranked.filter(
      (p) => scoreQueryRelevance(p, filters.query) > 0
    )

    const products = (withRelevance.length > 0 ? withRelevance : ranked).slice(0, count)

    return {
      products,
      empty: products.length === 0,
      emptyMessage:
        products.length === 0
          ? buildEmptySearchMessage(filters, null)
          : undefined,
      appliedFilters: filters,
    }
  }

  const hybrid = await hybridSearch({
    query: filters.query,
    matchCount: count + 4,
    filterCategory: filters.category,
    filterGender: filters.gender,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  })

  const products = hybrid
    .filter((p) => isTrustedCatalogProduct(p) && productMatchesFilters(p, filters))
    .slice(0, count)

  return {
    products,
    empty: products.length === 0,
    emptyMessage:
      products.length === 0 ? buildEmptySearchMessage(filters, null) : undefined,
    appliedFilters: filters,
  }
}
