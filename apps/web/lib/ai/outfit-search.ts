import type { HybridSearchResult } from '@/lib/supabase/types'
import { fetchFilteredCatalog } from '@/lib/ai/catalog-search'
import {
  mergeSearchFilters,
  parseQueryConstraints,
  scoreQueryRelevance,
  type ProductCategory,
} from '@/lib/ai/search-constraints'

const OUTFIT_SLOTS: ProductCategory[] = ['tops', 'trousers', 'outerwear', 'accessories']

export type OutfitLookItem = {
  id: string
  title: string
  sku: string
  price: number
  category: string
  imageUrl: string
  colors: string[]
  sizes: string[]
  brand?: string
}

export type BudgetOutfitResult = {
  look: OutfitLookItem[]
  totalPrice: number
  totalBudgetMax: number | null
  empty: boolean
  emptyMessage?: string
}

function toLookItem(p: HybridSearchResult): OutfitLookItem {
  return {
    id: p.product_id,
    title: p.title,
    sku: p.sku,
    price: p.price,
    category: p.category,
    imageUrl: p.image_urls?.[0] ?? '',
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    brand: p.brand,
  }
}

function rankCandidates(
  candidates: HybridSearchResult[],
  searchQuery: string,
  totalBudgetMax: number | null
): HybridSearchResult[] {
  return [...candidates].sort((a, b) => {
    if (totalBudgetMax !== null) {
      const priceDiff = a.price - b.price
      if (priceDiff !== 0) return priceDiff
    }
    const rel =
      scoreQueryRelevance(b, searchQuery) - scoreQueryRelevance(a, searchQuery)
    if (rel !== 0) return rel
    return a.price - b.price
  })
}

/**
 * Suggest another catalog piece for one outfit slot (excludes SKUs already in the look).
 */
export async function swapOutfitSlot(options: {
  occasion: string
  colorPalette?: string
  queryText?: string
  category: ProductCategory
  excludeSkus: string[]
  totalBudgetMax?: number | null
  otherItemsTotal: number
}): Promise<OutfitLookItem | null> {
  const queryText = options.queryText ?? options.occasion
  const parsed = parseQueryConstraints(queryText)
  const totalBudgetMax = options.totalBudgetMax ?? parsed.priceMax ?? null

  const searchQuery = [options.occasion, options.colorPalette, queryText]
    .filter(Boolean)
    .join(' ')

  const filters = mergeSearchFilters(
    {
      query: searchQuery,
      category: options.category,
    },
    parsed
  )

  if (totalBudgetMax !== null) {
    const remaining = totalBudgetMax - options.otherItemsTotal
    if (remaining <= 0) return null
    filters.priceMax = remaining
  }

  const candidates = await fetchFilteredCatalog(filters)
  const ranked = rankCandidates(candidates, searchQuery, totalBudgetMax)
  const next = ranked.find((p) => !options.excludeSkus.includes(p.sku))
  return next ? toLookItem(next) : null
}

/**
 * Build a head-to-toe look from DB rows only.
 * When totalBudgetMax is set, each piece must fit the remaining budget (greedy, cheapest-first).
 */
export async function buildBudgetOutfit(options: {
  occasion: string
  colorPalette?: string
  queryText?: string
  totalBudgetMax?: number | null
}): Promise<BudgetOutfitResult> {
  const queryText = options.queryText ?? options.occasion
  const parsed = parseQueryConstraints(queryText)
  const totalBudgetMax =
    options.totalBudgetMax ?? parsed.priceMax ?? null

  const searchQuery = [options.occasion, options.colorPalette, queryText]
    .filter(Boolean)
    .join(' ')

  const look: OutfitLookItem[] = []
  let remaining = totalBudgetMax ?? Number.POSITIVE_INFINITY

  for (const category of OUTFIT_SLOTS) {
    if (totalBudgetMax !== null && remaining <= 0) break

    const filters = mergeSearchFilters(
      {
        query: searchQuery,
        category,
        priceMax: totalBudgetMax !== null ? remaining : undefined,
      },
      parsed
    )

    if (totalBudgetMax !== null) {
      filters.priceMax = remaining
    }

    const candidates = await fetchFilteredCatalog(filters)
    if (!candidates.length) continue

    const pick = rankCandidates(candidates, searchQuery, totalBudgetMax)[0]

    if (totalBudgetMax !== null && pick.price > remaining) continue

    look.push(toLookItem(pick))
    remaining -= pick.price
  }

  const totalPrice = look.reduce((sum, item) => sum + item.price, 0)

  let emptyMessage: string | undefined
  if (totalBudgetMax !== null) {
    if (look.length === 0) {
      emptyMessage = `No pieces in our catalog fit a complete look within ₹${totalBudgetMax.toLocaleString('en-IN')}. Try a higher budget or browse by category.`
    } else if (look.length < OUTFIT_SLOTS.length) {
      emptyMessage = `Only ${look.length} of ${OUTFIT_SLOTS.length} slots fit within ₹${totalBudgetMax.toLocaleString('en-IN')}. Prices shown are from our live catalog.`
    } else if (totalPrice > totalBudgetMax) {
      emptyMessage = `This combination exceeds ₹${totalBudgetMax.toLocaleString('en-IN')}.`
    }
  }

  return {
    look,
    totalPrice,
    totalBudgetMax,
    empty: look.length === 0,
    emptyMessage,
  }
}
