import { tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { hybridSearch } from '@/lib/ai/search'
import { searchForOccasion } from '@/lib/ai/occasion-search'
import type { OccasionKey } from '@/lib/ai/occasion-search'
import { buildBudgetOutfit } from '@/lib/ai/outfit-search'
import { createClient } from '@/lib/supabase/server'

import { searchSchema, searchProductsExecute } from './tool-handlers/search-products'
import { inventorySchema, checkInventoryExecute } from './tool-handlers/check-inventory'
import { visualSearchSchema, visualSearchExecute } from './tool-handlers/visual-search'
import { catalogCountSchema, getCatalogCountExecute } from './tool-handlers/catalog-count'

/**
 * Vestira Concierge Tool Registry — AI SDK v6 compatible
 */

// ─────────────────────────────────────────────────────────────────────
// TOOL 1: searchProducts
// ─────────────────────────────────────────────────────────────────────
export const searchProductsTool = tool<z.infer<typeof searchSchema>, Awaited<ReturnType<typeof searchProductsExecute>>>({
  description:
    'Search the fashion catalog with strict filters. ALWAYS set category and priceMax/priceMin when the user specifies them. Returns only DB rows matching ALL filters — empty list if none exist (never unrelated products).',
  inputSchema: searchSchema,
  execute: searchProductsExecute,
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 2: checkInventory
// ─────────────────────────────────────────────────────────────────────
export const checkInventoryTool = tool<z.infer<typeof inventorySchema>, Awaited<ReturnType<typeof checkInventoryExecute>>>({
  description: 'Check real-time stock availability for a specific product SKU.',
  inputSchema: inventorySchema,
  execute: checkInventoryExecute,
})

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
    totalBudgetMax: z.number().optional().describe('Total outfit budget in INR. Sum of all pieces must stay at or below this.'),
    queryText: z.string().optional().describe('Original user message — used to parse budget if totalBudgetMax omitted'),
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
export const compareProductsTool = tool({
  description: 'Compare two products side-by-side. Use when the user asks to compare two products or is deciding between two items.',
  inputSchema: z.object({
    skuA: z.string().describe('SKU of first product to compare'),
    skuB: z.string().describe('SKU of second product to compare'),
  }),
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
/** Normalize free-text occasion synonyms to a valid OccasionKey. */
function normalizeOccasion(raw: string): OccasionKey {
  const val = raw.toLowerCase().trim()
  if (val === 'wedding' || val === 'gala' || val === 'formal' || val === 'bridal' || val === 'ceremony') return 'wedding'
  if (val === 'office' || val === 'work' || val === 'business' || val === 'corporate' || val === 'professional') return 'office'
  if (val === 'vacation' || val === 'travel' || val === 'beach' || val === 'resort' || val === 'holiday') return 'vacation'
  if (val === 'date night' || val === 'date' || val === 'evening' || val === 'dinner' || val === 'romantic') return 'date night'
  if (val === 'party' || val === 'celebration' || val === 'cocktail' || val === 'festive' || val === 'night out') return 'party'
  return 'casual'
}

export const recommendByOccasionTool = tool({
  description:
    'Recommend products for a named occasion (wedding, office, vacation, date night, party, casual). Use when the user frames an event/occasion — NOT for generic catalog browse (use searchProducts). Same product grid UI with occasion header.',
  inputSchema: z.object({
    occasion: z.string().describe('The occasion to recommend items for. Must be one of: wedding, office, vacation, date night, party, casual.'),
    count: z.coerce.number().optional().describe('Number of items (default 6)'),
  }),
  execute: async (params) => {
    const { occasion: rawOccasion, count = 6 } = params
    const occasion = normalizeOccasion(rawOccasion)
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
export const visualSearchTool = tool({
  description: 'Find products matching a visual/image description. ALWAYS pass chatId from the current session. If you identified the exact product SKU from the catalog, pass it as exactSku so the search results show the exact product first.',
  inputSchema: visualSearchSchema,
  execute: visualSearchExecute,
})

// ─────────────────────────────────────────────────────────────────────
// TOOL 11: getProductDetails
// ─────────────────────────────────────────────────────────────────────
export const getProductDetailsTool = tool({
  description: 'Retrieve detailed information for a specific product by SKU.',
  inputSchema: z.object({
    sku: z.string().describe('The product SKU to get details for'),
  }),
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
// TOOL 12: getCatalogCount
// ─────────────────────────────────────────────────────────────────────
export const getCatalogCountTool = tool({
  description:
    'Count how many products match specific discovery filters (category, price range, keyword). ' +
    'Use ONLY for discovery-intent count queries like "how many blue dresses do you have?". ' +
    'NEVER use for abstract totals like "how many pieces in your store?". ' +
    'After returning the count, immediately call searchProducts to show the matching products.',
  inputSchema: catalogCountSchema,
  execute: getCatalogCountExecute,
})

// ─────────────────────────────────────────────────────────────────────
// Export stopWhen helper for chat route
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
  getCatalogCount: getCatalogCountTool,
} as const

export type AgentToolName = keyof typeof agentTools
