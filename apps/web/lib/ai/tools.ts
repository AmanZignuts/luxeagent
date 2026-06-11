import { tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { checkInventory, hybridSearch } from '@/lib/ai/search'
import { searchForOccasion } from '@/lib/ai/occasion-search'
import type { OccasionKey } from '@/lib/ai/occasion-search'
import { strictCatalogSearch } from '@/lib/ai/catalog-search'
import { buildBudgetOutfit } from '@/lib/ai/outfit-search'
import {
  mergeSearchFilters,
  parseQueryConstraints,
  describeAppliedFilters,
} from '@/lib/ai/search-constraints'
import { createClient } from '@/lib/supabase/server'
import { getImageForChat, clearImageForChat } from '@/lib/ai/image-store'

/**
 * LuxeAgent Tool Registry — AI SDK v6 compatible
 * AI SDK v6 uses `inputSchema` instead of `parameters`
 */

// ─────────────────────────────────────────────────────────────────────
// TOOL 1: searchProducts
// ─────────────────────────────────────────────────────────────────────
const searchSchema = z.object({
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
  count: z.number().optional().describe('Number of items to return (default 6)'),
})

export const searchProductsTool = tool<z.infer<typeof searchSchema>, Awaited<ReturnType<typeof searchProductsExecute>>>({
  description:
    'Search the fashion catalog with strict filters. ALWAYS set category and priceMax/priceMin when the user specifies them. Returns only DB rows matching ALL filters — empty list if none exist (never unrelated products).',
  inputSchema: searchSchema,
  execute: searchProductsExecute,
})

async function searchProductsExecute(params: z.infer<typeof searchSchema>) {
  const { query, category, gender, priceMin, priceMax, count = 6 } = params
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

// ─────────────────────────────────────────────────────────────────────
// TOOL 2: checkInventory
// ─────────────────────────────────────────────────────────────────────
const inventorySchema = z.object({
  sku: z.string().describe('The product SKU to check inventory for'),
})

export const checkInventoryTool = tool<z.infer<typeof inventorySchema>, Awaited<ReturnType<typeof checkInventoryExecute>>>({
  description: 'Check real-time stock availability for a specific product SKU.',
  inputSchema: inventorySchema,
  execute: checkInventoryExecute,
})

async function checkInventoryExecute(params: z.infer<typeof inventorySchema>) {
  const { sku } = params
  const result = await checkInventory(sku)
  if (!result) return { type: 'inventory_not_found' as const, sku }

  const stockMap = (result.stock_by_size ?? {}) as Record<string, number>
  const availableSizes = Object.entries(stockMap)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => ({ size, qty }))
  const totalStock = Object.values(stockMap).reduce((sum: number, q: unknown) => sum + (q as number), 0)

  return {
    type: 'size_picker' as const,
    productId: (result.product_id as string) ?? '',
    title: (result.title as string) ?? '',
    sku: (result.sku as string) ?? sku,
    stockBySize: stockMap,
    availableSizes,
    totalStock,
    isLowStock: totalStock < 5,
    isActive: (result.is_active as boolean) ?? true,
  }
}

// ─────────────────────────────────────────────────────────────────────
// TOOL 3: getUserStyleProfile
// ─────────────────────────────────────────────────────────────────────
export const getUserStyleProfileTool = tool({
  description: 'Retrieve the current user\'s style preferences and persona. Use at session start or when user asks for personalized recommendations.',
  inputSchema: z.object({
    userId: z.string().optional().describe('Optional user ID if known (defaults to current authenticated user)'),
  }),
  execute: async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { type: 'no_profile' as const, message: 'User not authenticated' }

    const { data: profile } = await supabase
      .from('user_style_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) return { type: 'no_profile' as const, message: 'No style profile found.' }

    return {
      type: 'style_profile' as const,
      userId: profile.user_id,
      displayName: profile.display_name,
      styleTokens: profile.style_tokens,
      preferredSize: profile.preferred_size,
      budgetMin: profile.budget_min,
      budgetMax: profile.budget_max,
      preferredColors: profile.preferred_colors,
      preferredCategories: profile.preferred_categories,
      onboardingComplete: profile.onboarding_complete,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 4: getPersonalizedRecommendations
// ─────────────────────────────────────────────────────────────────────
export const getPersonalizedRecsTool = tool({
  description: 'Get personalized product recommendations based on the user\'s style profile.',
  inputSchema: z.object({
    occasion: z.string().optional().describe('Occasion context: "office", "evening", "weekend", "travel"'),
    count: z.number().optional().describe('Number of items (default 4)'),
  }),
  execute: async (params) => {
    const { occasion, count = 4 } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { type: 'error' as const, message: 'Not authenticated', products: [] }

    const { data: profile } = await supabase
      .from('user_style_profiles')
      .select('style_tokens, preferred_colors, budget_min, budget_max')
      .eq('user_id', user.id)
      .single()

    const queryParts = [
      ...(profile?.style_tokens ?? ['minimalist', 'elegant']),
      ...(profile?.preferred_colors ?? []),
      occasion ?? '',
    ].filter(Boolean)

    const results = await hybridSearch({
      query: queryParts.join(' '),
      matchCount: count,
      priceMin: profile?.budget_min ?? null,
      priceMax: profile?.budget_max ?? null,
    })

    return {
      type: 'personalized_carousel' as const,
      products: results.map((p) => ({
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
        rrfScore: p.rrf_score,
      })),
      styleContext: profile?.style_tokens ?? [],
      occasion,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 5: generateOutfitLook
// ─────────────────────────────────────────────────────────────────────
export const generateOutfitLookTool = tool({
  description:
    'Generate a complete head-to-toe outfit (top, bottom, layer, accessory) from catalog DB rows only. MUST pass totalBudgetMax when user says outfit under/below ₹X — total look price cannot exceed it. Never include items above budget.',
  inputSchema: z.object({
    occasion: z.string().describe('Occasion: "gala", "office", "casual", "weekend"'),
    colorPalette: z.string().optional().describe('Color palette: "monochrome", "earth tones", "all ivory"'),
    baseItem: z.string().optional().describe('Anchor item to build look around'),
    totalBudgetMax: z
      .number()
      .optional()
      .describe('Total outfit budget in INR (e.g. 200 for "outfit under ₹200"). Sum of all pieces must stay at or below this.'),
    queryText: z
      .string()
      .optional()
      .describe('Original user message — used to parse budget if totalBudgetMax omitted'),
  }),
  execute: async (params) => {
    const { occasion, colorPalette, baseItem, totalBudgetMax, queryText } = params

    const { look, totalPrice, totalBudgetMax: budget, empty, emptyMessage } =
      await buildBudgetOutfit({
        occasion,
        colorPalette,
        queryText: queryText ?? occasion,
        totalBudgetMax: totalBudgetMax ?? null,
      })

    return {
      type: 'outfit_builder' as const,
      occasion,
      colorPalette,
      baseItem,
      look,
      totalPrice,
      totalBudgetMax: budget,
      itemCount: look.length,
      empty,
      emptyMessage,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 6: getOrderStatus
// ─────────────────────────────────────────────────────────────────────
export const getOrderStatusTool = tool({
  description: 'Get the status of the user\'s orders. Use when they ask about delivery or purchase history.',
  inputSchema: z.object({
    orderId: z.string().optional().describe('Specific order ID. If not provided, returns recent orders.'),
  }),
  execute: async (params) => {
    const { orderId } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { type: 'error' as const, message: 'Not authenticated', orders: [] }

    const { data: orders, error } = orderId
      ? await supabase.from('orders').select('id,status,total,items,created_at,tracking_number').eq('user_id', user.id).eq('id', orderId)
      : await supabase.from('orders').select('id,status,total,items,created_at,tracking_number').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)

    if (error) return { type: 'error' as const, message: error.message, orders: [] }

    return {
      type: 'order_status' as const,
      orders: (orders ?? []).map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        itemCount: (o.items as unknown[]).length,
        createdAt: o.created_at,
        trackingNumber: o.tracking_number,
      })),
    }
  },
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 7: addToBag
// ─────────────────────────────────────────────────────────────────────
export const addToBagTool = tool({
  description: 'Add a product to the shopping bag. Use when the user explicitly asks to add an item.',
  inputSchema: z.object({
    productId: z.string(),
    sku: z.string(),
    title: z.string(),
    size: z.string(),
    price: z.number(),
    imageUrl: z.string(),
  }),
  execute: async (params) => {
    const { productId, sku, title, size, price, imageUrl } = params
    return {
      type: 'add_to_bag_confirm' as const,
      action: 'ADD_TO_BAG' as const,
      item: { productId, sku, title, size, price, imageUrl, qty: 1 },
      message: `Added ${title} (${size}) to your bag.`,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 8: compareProducts
// ─────────────────────────────────────────────────────────────────────
const comparisonSchema = z.object({
  skuA: z.string().describe('SKU of first product to compare'),
  skuB: z.string().describe('SKU of second product to compare'),
})

export const compareProductsTool = tool({
  description: 'Compare two products side-by-side. Use when the user asks to compare two products or is deciding between two items.',
  inputSchema: comparisonSchema,
  execute: async (params) => {
    const { skuA, skuB } = params
    const supabase = await createClient()
    const { data: itemA } = await supabase.from('products').select('*').eq('sku', skuA).single()
    const { data: itemB } = await supabase.from('products').select('*').eq('sku', skuB).single()

    if (!itemA || !itemB) {
      return { type: 'error' as const, message: 'Could not find one or both products for comparison.' }
    }

    const formatProduct = (p: any) => ({
      id: p.id,
      title: p.title,
      sku: p.sku,
      price: p.price,
      category: p.category,
      imageUrl: p.image_urls?.[0] ?? '',
      brand: p.brand,
      material: p.material_composition ?? 'Atelier Sourced Fiber',
      colors: p.colors ?? [],
      sizes: p.sizes ?? [],
      tags: p.tags ?? [],
      description: p.description,
    })

    return {
      type: 'product_comparison' as const,
      productA: formatProduct(itemA),
      productB: formatProduct(itemB),
    }
  }
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 9: recommendByOccasion
// ─────────────────────────────────────────────────────────────────────
const occasionRecSchema = z.object({
  occasion: z.enum(['wedding', 'office', 'vacation', 'date night', 'party', 'casual']).describe('The occasion to recommend items for'),
  count: z.number().optional().describe('Number of items (default 6)'),
})

export const recommendByOccasionTool = tool({
  description:
    'Recommend products for a named occasion (wedding, office, vacation, date night, party, casual). Use when the user frames an event/occasion — NOT for generic catalog browse (use searchProducts). Same product grid UI with occasion header.',
  inputSchema: occasionRecSchema,
  execute: async (params) => {
    const { occasion, count = 6 } = params
    const results = await searchForOccasion(occasion as OccasionKey, count)

    return {
      type: 'occasion_recommendation' as const,
      occasion,
      products: results.map((p) => ({
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
      })),
    }
  }
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 10: findSimilarProducts (Visual Search)
// ─────────────────────────────────────────────────────────────────────
const visualSearchSchema = z.object({
  imageDescription: z.string().describe('Rich visual description of the uploaded image: garment type, color, fabric, graphic/print details, brand name visible, aesthetic, style.'),
  chatId: z.string().optional().describe('Chat session ID used to retrieve the uploaded image for pixel-level fingerprint matching.'),
  exactSku: z.string().optional().describe('The SKU of the exact product in our catalog if it matches the uploaded image. Check the product list in your system instructions.'),
  gender: z.enum(['women', 'men', 'unisex']).optional(),
  count: z.number().optional().describe('Number of items (default 6)'),
})

/**
 * Computes a byte-level fingerprint from raw image bytes for fast similarity comparison.
 */
function extractByteFingerprint(bytes: Uint8Array): number[] {
  const SAMPLES = 256
  const step = Math.max(1, Math.floor(bytes.length / SAMPLES))
  const fingerprint: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const pos = i * step
    fingerprint.push(pos < bytes.length ? bytes[pos] / 255 : 0)
  }
  return fingerprint
}

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/** Parse category from an image description string */
function extractCategoryFromDescription(desc: string): string | null {
  const lower = desc.toLowerCase()
  if (/\bt[-\s]?shirt|tee|graphic tee|tshirt\b/.test(lower)) return 'tops'
  if (/\bshirt|blouse|top|cami|tank\b/.test(lower)) return 'tops'
  if (/\bdress|gown|midi|maxi|mini dress\b/.test(lower)) return 'dresses'
  if (/\bpant|trouser|jean|chino|bottom\b/.test(lower)) return 'trousers'
  if (/\bcoat|jacket|blazer|outerwear|cardigan\b/.test(lower)) return 'outerwear'
  if (/\bbag|scarf|belt|accessory\b/.test(lower)) return 'accessories'
  return null
}

function formatProductRow(p: Record<string, unknown>, score?: number) {
  return {
    id: p.id as string,
    title: p.title as string,
    sku: p.sku as string,
    price: p.price as number,
    category: p.category as string,
    tags: (p.tags as string[]) ?? [],
    imageUrl: ((p.image_urls as string[])?.[0]) ?? '',
    imageUrls: (p.image_urls as string[]) ?? [],
    colors: (p.colors as string[]) ?? [],
    sizes: (p.sizes as string[]) ?? [],
    stockBySize: (p.stock_by_size ?? {}) as Record<string, number>,
    brand: p.brand as string,
    description: p.description as string,
    similarityScore: score !== undefined ? Math.round(score * 100) : undefined,
  }
}

export const visualSearchTool = tool({
  description: 'Find products matching a visual/image description. ALWAYS pass chatId from the current session. If you identified the exact product SKU from the catalog, pass it as exactSku so the search results show the exact product first.',
  inputSchema: visualSearchSchema,
  execute: async (params) => {
    const { imageDescription, chatId, exactSku, gender, count = 6 } = params
    const supabase = await createClient()

    // ── Stage 0: Exact SKU matching ──
    if (exactSku) {
      console.log(`[visualSearch] exactSku provided: ${exactSku}`)
      const { data: p } = await supabase
        .from('products')
        .select('id, title, sku, price, category, brand, image_urls, colors, sizes, tags, description, stock_by_size')
        .eq('sku', exactSku)
        .eq('is_active', true)
        .maybeSingle()

      if (p) {
        console.log(`[visualSearch] Found exact product by SKU: ${p.title}`)
        let similarProducts: Record<string, unknown>[] = []
        try {
          const results = await hybridSearch({
            query: imageDescription,
            matchCount: count + 4,
            filterGender: gender ?? null,
            semanticWeight: 0.85,
            keywordWeight: 0.15,
          })
          similarProducts = results
            .filter((item) => item.sku !== exactSku)
            .slice(0, count - 1)
            .map((item) => ({
              id: item.product_id,
              title: item.title,
              sku: item.sku,
              price: item.price,
              category: item.category,
              tags: item.tags,
              image_urls: item.image_urls,
              colors: item.colors,
              sizes: item.sizes,
              stock_by_size: item.stock_by_size,
              brand: item.brand,
              description: item.description,
            })) as any[]
        } catch (err) {
          console.warn('[visualSearch] Hybrid search failed for similar items, querying by category:', err)
          const detectedCategory = extractCategoryFromDescription(imageDescription)
          let q = supabase
            .from('products')
            .select('id, title, sku, price, category, brand, image_urls, colors, sizes, tags, description, stock_by_size')
            .eq('is_active', true)
            .neq('sku', exactSku)
          if (detectedCategory) {
            q = q.eq('category', detectedCategory)
          }
          const { data: fallbackProducts } = await q.limit(count - 1)
          similarProducts = (fallbackProducts ?? []) as Record<string, unknown>[]
        }

        if (chatId) {
          clearImageForChat(chatId)
        }

        const formattedExact = formatProductRow(p as Record<string, unknown>, 1.0)
        const formattedSimilar = similarProducts.map((item) => formatProductRow(item))

        return {
          type: 'image_search_result' as const,
          imageDescription,
          exactMatch: true,
          topScore: 100,
          products: [formattedExact, ...formattedSimilar],
        }
      }
    }

    // ── Stage 1: Pixel fingerprint matching (exact/near-exact match) ──
    if (chatId) {
      const imageBase64 = getImageForChat(chatId)
      if (imageBase64) {
        try {
          console.log('[visualSearch] Attempting pixel fingerprint match...')
          const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
          const uploadedBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'))
          const uploadedFingerprint = extractByteFingerprint(uploadedBytes)

          const { data: allProducts } = await supabase
            .from('products')
            .select('id, title, sku, price, category, brand, image_urls, colors, sizes, tags, description, stock_by_size')
            .eq('is_active', true)
            .not('image_urls', 'is', null)

          if (allProducts && allProducts.length > 0) {
            const BATCH = 6
            const scored: Array<{ product: typeof allProducts[0]; score: number }> = []

            for (let i = 0; i < allProducts.length; i += BATCH) {
              const batch = allProducts.slice(i, i + BATCH)
              const results = await Promise.allSettled(
                batch.map(async (p) => {
                  const url = (p.image_urls as string[])?.[0]
                  if (!url) return null

                  const ctrl = new AbortController()
                  const timer = setTimeout(() => ctrl.abort(), 5000)
                  try {
                    const res = await fetch(url, {
                      signal: ctrl.signal,
                      headers: { 'User-Agent': 'LuxeAgent/1.0' }
                    })
                    clearTimeout(timer)
                    if (!res.ok) return null
                    const buf = await res.arrayBuffer()
                    const bytes = new Uint8Array(buf)
                    const fp = extractByteFingerprint(bytes)
                    const score = cosineSim(uploadedFingerprint, fp)
                    return { product: p, score }
                  } catch {
                    clearTimeout(timer)
                    return null
                  }
                })
              )

              for (const r of results) {
                if (r.status === 'fulfilled' && r.value !== null) {
                  scored.push(r.value)
                }
              }
            }

            clearImageForChat(chatId)

            if (scored.length > 0) {
              scored.sort((a, b) => b.score - a.score)
              const EXACT_THRESHOLD = 0.97
              const topMatches = scored.slice(0, count)

              console.log(`[visualSearch] Fingerprint top score: ${topMatches[0].score.toFixed(3)}, product: ${topMatches[0].product.title}`)

              return {
                type: 'image_search_result' as const,
                imageDescription,
                exactMatch: topMatches[0].score >= EXACT_THRESHOLD,
                topScore: Math.round(topMatches[0].score * 100),
                products: topMatches.map(({ product: p, score }: { product: typeof scored[0]['product']; score: number }) =>
                  formatProductRow(p as Record<string, unknown>, score)
                ),
              }
            }
          }
        } catch (err) {
          console.warn('[visualSearch] Fingerprint matching failed, falling back to text search:', err)
        }
      }
    }

    // ── Stage 2: Text-based hybrid search fallback ──
    console.log('[visualSearch] Using text-based hybrid search for:', imageDescription)
    try {
      const results = await hybridSearch({
        query: imageDescription,
        matchCount: count + 4,
        filterGender: gender ?? null,
        semanticWeight: 0.85,
        keywordWeight: 0.15,
      })

      if (results.length > 0) {
        return {
          type: 'image_search_result' as const,
          imageDescription,
          exactMatch: false,
          products: results.slice(0, count).map((p) => ({
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
          })),
        }
      }
    } catch (err) {
      console.warn('[visualSearch] Hybrid search failed, using DB fallback:', err)
    }

    // ── Stage 3: Guaranteed DB fallback — always return something ──
    console.log('[visualSearch] Using guaranteed DB fallback')
    const detectedCategory = extractCategoryFromDescription(imageDescription)

    let fallbackQuery = supabase
      .from('products')
      .select('id, title, sku, price, category, brand, image_urls, colors, sizes, tags, description, stock_by_size')
      .eq('is_active', true)

    if (detectedCategory) {
      fallbackQuery = (fallbackQuery as any).eq('category', detectedCategory)
    }

    const { data: fallbackProducts } = await (fallbackQuery as any).limit(count)
    let finalProducts = (fallbackProducts ?? []) as Record<string, unknown>[]

    // If category-filtered returned nothing, fetch any active products
    if (finalProducts.length === 0) {
      const { data: anyProducts } = await supabase
        .from('products')
        .select('id, title, sku, price, category, brand, image_urls, colors, sizes, tags, description, stock_by_size')
        .eq('is_active', true)
        .limit(count)
      finalProducts = (anyProducts ?? []) as Record<string, unknown>[]
    }

    return {
      type: 'image_search_result' as const,
      imageDescription,
      exactMatch: false,
      products: finalProducts.map((p) => formatProductRow(p)),
    }
  }
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 11: getProductDetails
// ─────────────────────────────────────────────────────────────────────
const productDetailsSchema = z.object({
  sku: z.string().describe('The product SKU to get details for'),
})

export const getProductDetailsTool = tool({
  description: 'Retrieve detailed information for a specific product by SKU.',
  inputSchema: productDetailsSchema,
  execute: async (params) => {
    const { sku } = params
    const supabase = await createClient()
    const { data: p } = await supabase.from('products').select('*').eq('sku', sku).single()

    if (!p) return { type: 'product_not_found' as const, sku }

    return {
      type: 'product_details' as const,
      product: {
        id: p.id,
        title: p.title,
        sku: p.sku,
        price: p.price,
        category: p.category,
        brand: p.brand,
        description: p.description,
        material: p.material_composition ?? 'Atelier Sourced Fiber',
        colors: p.colors ?? [],
        sizes: p.sizes ?? [],
        imageUrl: p.image_urls?.[0] ?? '',
        imageUrls: p.image_urls ?? [],
        tags: p.tags ?? [],
      }
    }
  }
})

// ─────────────────────────────────────────────────────────────────────
// Export stopWhen helper for chat route (replaces maxSteps)
// ─────────────────────────────────────────────────────────────────────
export { stepCountIs }

export const agentTools = {
  searchProducts: searchProductsTool,
  checkInventory: checkInventoryTool,
  getUserStyleProfile: getUserStyleProfileTool,
  getPersonalizedRecommendations: getPersonalizedRecsTool,
  generateOutfitLook: generateOutfitLookTool,
  getOrderStatus: getOrderStatusTool,
  addToBag: addToBagTool,
  compareProducts: compareProductsTool,
  recommendByOccasion: recommendByOccasionTool,
  findSimilarProducts: visualSearchTool,
  getProductDetails: getProductDetailsTool,
} as const

export type AgentToolName = keyof typeof agentTools
