import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const catalogCountSchema = z.object({
  query: z.string().optional().describe('Natural-language keyword filter (e.g. "silk", "blue saree", "sale")'),
  category: z.string().optional().describe('Category filter: tops, dresses, trousers, outerwear, accessories, etc.'),
  gender: z.string().optional().describe('Gender filter: women, men, unisex'),
  priceMin: z.number().optional().describe('Minimum price in INR'),
  priceMax: z.number().optional().describe('Maximum price in INR'),
})

export async function getCatalogCountExecute(params: z.infer<typeof catalogCountSchema>) {
  const { query, category, gender, priceMin, priceMax } = params
  const supabase = await createClient()

  let q = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (category) q = (q as any).ilike('category', `%${category}%`)
  if (gender) q = (q as any).ilike('gender', `%${gender}%`)
  if (priceMin !== undefined) q = (q as any).gte('price', priceMin)
  if (priceMax !== undefined) q = (q as any).lte('price', priceMax)
  if (query) q = (q as any).textSearch('fts_document', query, { config: 'english', type: 'websearch' })

  const { count, error } = await q

  const labelParts: string[] = []
  if (query) labelParts.push(query)
  if (category) labelParts.push(category)
  if (gender) labelParts.push(`(${gender})`)
  if (priceMin !== undefined && priceMax !== undefined) {
    labelParts.push(`₹${priceMin}–₹${priceMax}`)
  } else if (priceMax !== undefined) {
    labelParts.push(`under ₹${priceMax}`)
  } else if (priceMin !== undefined) {
    labelParts.push(`over ₹${priceMin}`)
  }
  const label = labelParts.join(' ') || 'products'

  if (error) {
    console.error('[getCatalogCount] Supabase error:', error)
    return { type: 'catalog_count' as const, count: 0, label, error: error.message }
  }

  return { type: 'catalog_count' as const, count: count ?? 0, label }
}
