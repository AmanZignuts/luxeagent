import type { HybridSearchResult } from '@/lib/supabase/types'
import { hybridSearch } from '@/lib/ai/search'

export type OccasionKey =
  | 'wedding'
  | 'office'
  | 'vacation'
  | 'date night'
  | 'party'
  | 'casual'

type OccasionProfile = {
  /** Rich query for hybrid / FTS — must differ strongly per occasion */
  query: string
  /** Tags that boost relevance when present on a product */
  boostTags: string[]
  /** Pull at least one item from each category for variety */
  categories: Array<'dresses' | 'tops' | 'outerwear' | 'trousers' | 'accessories'>
}

export const OCCASION_SEARCH_PROFILES: Record<OccasionKey, OccasionProfile> = {
  wedding: {
    query:
      'wedding guest formal dress ivory blush silk ceremony elegant gown reception bridal evening',
    boostTags: ['formal', 'ivory', 'bridal', 'silk', 'evening', 'elegant', 'champagne', 'romantic'],
    categories: ['dresses', 'accessories', 'outerwear'],
  },
  office: {
    query:
      'office professional tailored trousers blazer structured neutral polished corporate workwear minimalist',
    boostTags: ['tailored', 'structured', 'professional', 'formal', 'classic', 'minimalist', 'wool'],
    categories: ['trousers', 'tops', 'outerwear', 'dresses'],
  },
  vacation: {
    query:
      'resort vacation linen relaxed summer beach casual lightweight breathable resort wear',
    boostTags: ['linen', 'resort', 'relaxed', 'summer', 'casual', 'lightweight', 'breathable'],
    categories: ['dresses', 'tops', 'trousers', 'accessories'],
  },
  'date night': {
    query:
      'date night evening silk midi dress sophisticated midnight romantic sleek minimal glamour',
    boostTags: ['evening', 'silk', 'romantic', 'minimalist', 'editorial', 'satin'],
    categories: ['dresses', 'accessories', 'tops'],
  },
  party: {
    query:
      'party celebration statement dress jewel metallic bold evening cocktail festive glamour',
    boostTags: ['evening', 'editorial', 'statement', 'party', 'bold', 'metallic'],
    categories: ['dresses', 'accessories', 'outerwear'],
  },
  casual: {
    query:
      'casual everyday relaxed natural earth tones comfortable effortless luxury weekend',
    boostTags: ['casual', 'relaxed', 'comfortable', 'natural', 'capsule', 'cozy'],
    categories: ['tops', 'trousers', 'dresses', 'outerwear'],
  },
}

/** Seed / demo products use LX- SKUs; filter obvious bad ingests */
export function isTrustedCatalogProduct(p: {
  sku?: string
  title?: string
  image_urls?: string[]
}): boolean {
  const title = p.title ?? ''
  if (/quis|lorem|aspernatur|test product|placeholder/i.test(title)) return false
  if (p.sku?.startsWith('LX-') || p.sku?.startsWith('LA-')) return true
  const url = p.image_urls?.[0] ?? ''
  return (
    url.includes('unsplash.com') ||
    url.startsWith('/') ||
    url.includes('images.') ||
    url.includes('supabase.co')
  )
}

function tagOverlapScore(tags: string[] | undefined, boostTags: string[]): number {
  if (!tags?.length || !boostTags.length) return 0
  const normalized = tags.map((t) => t.toLowerCase())
  return boostTags.reduce((score, tag) => {
    const key = tag.toLowerCase()
    return score + (normalized.some((t) => t.includes(key) || key.includes(t)) ? 1 : 0)
  }, 0)
}

function rerankByOccasion(
  results: HybridSearchResult[],
  boostTags: string[]
): HybridSearchResult[] {
  return [...results].sort((a, b) => {
    const tagDiff =
      tagOverlapScore(b.tags, boostTags) - tagOverlapScore(a.tags, boostTags)
    if (tagDiff !== 0) return tagDiff
    return (b.rrf_score ?? 0) - (a.rrf_score ?? 0)
  })
}

function dedupeByProductId(results: HybridSearchResult[]): HybridSearchResult[] {
  const seen = new Set<string>()
  const out: HybridSearchResult[] = []
  for (const row of results) {
    if (seen.has(row.product_id)) continue
    seen.add(row.product_id)
    out.push(row)
  }
  return out
}

/**
 * Occasion recommendations: per-category hybrid search + tag rerank.
 * Avoids returning the same global top-6 for every occasion.
 */
export async function searchForOccasion(
  occasion: OccasionKey,
  count = 6
): Promise<HybridSearchResult[]> {
  const profile = OCCASION_SEARCH_PROFILES[occasion]
  const slotsPerCategory = Math.max(1, Math.ceil(count / profile.categories.length))

  const batches = await Promise.all(
    profile.categories.map((category) =>
      hybridSearch({
        query: profile.query,
        matchCount: slotsPerCategory + 2,
        filterCategory: category,
      })
    )
  )

  const merged = dedupeByProductId(
    batches.flat().filter((p) => isTrustedCatalogProduct(p))
  )
  const reranked = rerankByOccasion(merged, profile.boostTags)
  return reranked.slice(0, count)
}
