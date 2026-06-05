export type ProductCategory =
  | 'dresses'
  | 'tops'
  | 'outerwear'
  | 'trousers'
  | 'accessories'

export type CatalogSearchFilters = {
  query: string
  category: ProductCategory | null
  gender: 'women' | 'men' | 'unisex' | null
  priceMin: number | null
  priceMax: number | null
}

const CATEGORY_PATTERNS: Array<{ category: ProductCategory; pattern: RegExp }> = [
  { category: 'dresses', pattern: /\b(dress|dresses|gown|gowns)\b/i },
  { category: 'tops', pattern: /\b(top|tops|shirt|shirts|blouse|blouses|turtleneck|tee)\b/i },
  { category: 'trousers', pattern: /\b(trouser|trousers|pant|pants|jean|jeans)\b/i },
  { category: 'outerwear', pattern: /\b(outerwear|coat|coats|jacket|jackets|blazer|blazers|overcoat)\b/i },
  {
    category: 'accessories',
    pattern: /\b(accessor(y|ies)|scarf|scarves|bag|bags|clutch|belt|belts|jewelry)\b/i,
  },
]

const STOP_WORDS = new Set([
  'find',
  'show',
  'me',
  'the',
  'a',
  'an',
  'for',
  'and',
  'with',
  'under',
  'below',
  'above',
  'over',
  'less',
  'than',
  'more',
  'upto',
  'max',
  'min',
  'light',
  'summer',
  'winter',
  'spring',
  'autumn',
  'please',
  'looking',
  'want',
  'need',
  'get',
  'some',
  'any',
  'our',
  'catalog',
  'from',
  'in',
  'at',
  'to',
  'of',
  'rupees',
  'inr',
  'rs',
])

/** Parse category, price, gender from natural-language query (backup when the model omits tool args). */
export function parseQueryConstraints(query: string): Partial<CatalogSearchFilters> {
  const parsed: Partial<CatalogSearchFilters> = {}

  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(query)) {
      parsed.category = category
      break
    }
  }

  if (/\b(men'?s?|menswear)\b/i.test(query)) parsed.gender = 'men'
  else if (/\b(women'?s?|womenswear|ladies)\b/i.test(query)) parsed.gender = 'women'

  const pricePatterns: RegExp[] = [
    /(?:under|below|less\s+than|max(?:imum)?|upto|up\s+to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:or\s+less|max|and\s+below)/i,
    /(?:over|above|more\s+than|min(?:imum)?|from)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:or\s+more|and\s+above|\+)/i,
  ]

  const underMatch = query.match(pricePatterns[0]) ?? query.match(pricePatterns[1])
  if (underMatch) {
    parsed.priceMax = parsePriceNumber(underMatch[1])
  }

  const overMatch = query.match(pricePatterns[2]) ?? query.match(pricePatterns[3])
  if (overMatch) {
    parsed.priceMin = parsePriceNumber(overMatch[1])
  }

  return parsed
}

function parsePriceNumber(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ''))
}

export function mergeSearchFilters(
  tool: {
    query: string
    category?: ProductCategory
    gender?: 'women' | 'men' | 'unisex'
    priceMin?: number
    priceMax?: number
  },
  parsed: Partial<CatalogSearchFilters>
): CatalogSearchFilters {
  return {
    query: tool.query,
    category: tool.category ?? parsed.category ?? null,
    gender: tool.gender ?? parsed.gender ?? null,
    priceMin: tool.priceMin ?? parsed.priceMin ?? null,
    priceMax: tool.priceMax ?? parsed.priceMax ?? null,
  }
}

export function hasHardFilters(filters: CatalogSearchFilters): boolean {
  return (
    filters.category !== null ||
    filters.gender !== null ||
    filters.priceMin !== null ||
    filters.priceMax !== null
  )
}

export function productMatchesFilters(
  product: { category?: string; price?: number; gender?: string },
  filters: CatalogSearchFilters
): boolean {
  if (filters.category && product.category !== filters.category) return false
  if (filters.gender && product.gender && product.gender !== filters.gender) return false
  if (filters.priceMin !== null && (product.price ?? 0) < filters.priceMin) return false
  if (filters.priceMax !== null && (product.price ?? 0) > filters.priceMax) return false
  return true
}

/** Score how well product text matches soft keywords in the query. */
export function scoreQueryRelevance(
  product: {
    title?: string
    description?: string
    tags?: string[]
    category?: string
  },
  query: string
): number {
  const blob = [
    product.title ?? '',
    product.description ?? '',
    product.category ?? '',
    ...(product.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()

  const terms = query
    .toLowerCase()
    .replace(/[₹$]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ''))
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))

  if (!terms.length) return 0

  return terms.reduce((score, term) => (blob.includes(term) ? score + 1 : score), 0)
}

export function describeAppliedFilters(filters: CatalogSearchFilters): string {
  const parts: string[] = []
  if (filters.category) parts.push(filters.category)
  if (filters.priceMax !== null) parts.push(`under ₹${filters.priceMax.toLocaleString('en-IN')}`)
  if (filters.priceMin !== null) parts.push(`from ₹${filters.priceMin.toLocaleString('en-IN')}`)
  if (filters.gender) parts.push(filters.gender)
  return parts.length ? parts.join(' · ') : 'your search'
}
