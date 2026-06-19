import { z } from 'zod'
import { strictCatalogSearch } from '@/lib/ai/catalog-search'
import {
  mergeSearchFilters,
  parseQueryConstraints,
  describeAppliedFilters,
} from '@/lib/ai/search-constraints'

export const searchSchema = z.object({
  query: z.string().describe('The user\'s search query in natural language'),
  category: z
    .string()
    .optional()
    .describe('REQUIRED when user names a product type (e.g. dresses, tops). Results are limited to this category only.'),
  gender: z.string().optional(),
  priceMin: z.number().optional().describe('Minimum price in INR when user says "over ₹X" or "from ₹X".'),
  priceMax: z
    .number()
    .optional()
    .describe('Maximum price in INR when user says "under ₹X", "below ₹X", or "max ₹X". Results never exceed this.'),
  count: z.number().optional().describe('Number of items to return (default 24)'),
})

export async function searchProductsExecute(params: z.infer<typeof searchSchema>) {
  const { query, category, gender, priceMin, priceMax, count = 24 } = params
  const filters = mergeSearchFilters(
    { query, category: category as any, gender: gender as any, priceMin, priceMax },
    parseQueryConstraints(query)
  )

  const { products, totalFound, empty, emptyMessage, appliedFilters } = await strictCatalogSearch(
    filters,
    count
  )

  return {
    type: 'product_carousel' as const,
    products: products.map((p) => ({
      id: p.product_id,
      title: p.title,
      sku: p.sku,
      price: p.price,
      category: p.category,
      tags: p.tags,
      imageUrl: p.image_urls?.[0] ?? '',
      imageUrls: p.image_urls ?? [],
      colors: p.colors,
      sizes: p.sizes,
      stockBySize: p.stock_by_size as Record<string, number>,
      brand: p.brand,
      description: p.description,
      rrfScore: p.rrf_score,
    })),
    query,
    totalFound,
    empty,
    emptyMessage,
    appliedFilters: {
      category: appliedFilters.category,
      priceMin: appliedFilters.priceMin,
      priceMax: appliedFilters.priceMax,
      gender: appliedFilters.gender,
      label: describeAppliedFilters(appliedFilters),
    },
  }
}
