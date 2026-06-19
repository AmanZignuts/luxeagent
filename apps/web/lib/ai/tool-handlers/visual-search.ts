import { z } from 'zod'
import { hybridSearch } from '@/lib/ai/search'
import { getImageForChat, clearImageForChat } from '@/lib/ai/image-store'
import { createClient } from '@/lib/supabase/server'

export const visualSearchSchema = z.object({
  imageDescription: z.string().describe('Rich visual description of the uploaded image: garment type, color, fabric, graphic/print details, brand name visible, aesthetic, style.'),
  chatId: z.string().optional().describe('Chat session ID used to retrieve the uploaded image for pixel-level fingerprint matching.'),
  exactSku: z.string().optional().describe('The SKU of the exact product in our catalog if it matches the uploaded image. Check the product list in your system instructions.'),
  gender: z.enum(['women', 'men', 'unisex']).optional(),
  count: z.number().optional().describe('Number of items (default 24)'),
})

/**
 * Computes a byte-level fingerprint from raw image bytes for fast similarity comparison.
 */
export function extractByteFingerprint(bytes: Uint8Array): number[] {
  const SAMPLES = 256
  const step = Math.max(1, Math.floor(bytes.length / SAMPLES))
  const fingerprint: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const pos = i * step
    fingerprint.push(pos < bytes.length ? bytes[pos] / 255 : 0)
  }
  return fingerprint
}

export function cosineSim(a: number[], b: number[]): number {
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
export function extractCategoryFromDescription(desc: string): string | null {
  const lower = desc.toLowerCase()
  if (/\bt[-\s]?shirt|tee|graphic tee|tshirt\b/.test(lower)) return 'tops'
  if (/\bshirt|blouse|top|cami|tank\b/.test(lower)) return 'tops'
  if (/\bdress|gown|midi|maxi|mini dress\b/.test(lower)) return 'dresses'
  if (/\bpant|trouser|jean|chino|bottom\b/.test(lower)) return 'trousers'
  if (/\bcoat|jacket|blazer|outerwear|cardigan\b/.test(lower)) return 'outerwear'
  if (/\bbag|scarf|belt|accessory\b/.test(lower)) return 'accessories'
  return null
}

export function formatProductRow(p: Record<string, unknown>, score?: number) {
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

const PRODUCT_SELECT = 'id, title, sku, price, category, brand, image_urls, colors, sizes, tags, description, stock_by_size'

export async function visualSearchExecute(params: z.infer<typeof visualSearchSchema>) {
  const { imageDescription, chatId, exactSku, gender, count = 24 } = params
  const supabase = await createClient()

  // ── Stage 0: Exact SKU matching ──
  if (exactSku) {
    console.log(`[visualSearch] exactSku provided: ${exactSku}`)
    const { data: p } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
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
          .select(PRODUCT_SELECT)
          .eq('is_active', true)
          .neq('sku', exactSku)
        if (detectedCategory) {
          q = q.eq('category', detectedCategory)
        }
        const { data: fallbackProducts } = await q.limit(count - 1)
        similarProducts = (fallbackProducts ?? []) as Record<string, unknown>[]
      }

      if (chatId) clearImageForChat(chatId)

      return {
        type: 'image_search_result' as const,
        imageDescription,
        exactMatch: true,
        topScore: 100,
        products: [formatProductRow(p as Record<string, unknown>, 1.0), ...similarProducts.map((item) => formatProductRow(item))],
      }
    }
  }

  // ── Stage 1: Pixel fingerprint matching ──
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
          .select(PRODUCT_SELECT)
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
                  const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'VestiraConcierge/1.0' } })
                  clearTimeout(timer)
                  if (!res.ok) return null
                  const buf = await res.arrayBuffer()
                  const bytes = new Uint8Array(buf)
                  const fp = extractByteFingerprint(bytes)
                  return { product: p, score: cosineSim(uploadedFingerprint, fp) }
                } catch {
                  clearTimeout(timer)
                  return null
                }
              })
            )
            for (const r of results) {
              if (r.status === 'fulfilled' && r.value !== null) scored.push(r.value)
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
              products: topMatches.map(({ product: p, score }) =>
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

  // ── Stage 3: Guaranteed DB fallback ──
  console.log('[visualSearch] Using guaranteed DB fallback')
  const detectedCategory = extractCategoryFromDescription(imageDescription)
  let fallbackQuery = supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true)
  if (detectedCategory) {
    fallbackQuery = (fallbackQuery as any).eq('category', detectedCategory)
  }

  const { data: fallbackProducts } = await (fallbackQuery as any).limit(count)
  let finalProducts = (fallbackProducts ?? []) as Record<string, unknown>[]

  if (finalProducts.length === 0) {
    const { data: anyProducts } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
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
