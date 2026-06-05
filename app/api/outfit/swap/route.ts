import { NextResponse } from 'next/server'
import { swapOutfitSlot } from '@/lib/ai/outfit-search'
import type { ProductCategory } from '@/lib/ai/search-constraints'

export const runtime = 'nodejs'

const SLOT_CATEGORIES = new Set([
  'tops',
  'trousers',
  'outerwear',
  'accessories',
  'dresses',
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const category = body.category as string
    if (!SLOT_CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const item = await swapOutfitSlot({
      occasion: body.occasion ?? 'casual',
      colorPalette: body.colorPalette,
      queryText: body.queryText,
      category: category as ProductCategory,
      excludeSkus: Array.isArray(body.excludeSkus) ? body.excludeSkus : [],
      totalBudgetMax: body.totalBudgetMax ?? null,
      otherItemsTotal: Number(body.otherItemsTotal) || 0,
    })

    if (!item) {
      return NextResponse.json({ type: 'no_alternative' as const })
    }

    return NextResponse.json({ type: 'outfit_slot' as const, item })
  } catch (err) {
    console.error('[outfit/swap]', err)
    return NextResponse.json({ error: 'Swap failed' }, { status: 500 })
  }
}
