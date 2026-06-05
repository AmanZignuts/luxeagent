import { NextResponse } from 'next/server'
import { checkInventory } from '@/lib/ai/search'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const sku = new URL(request.url).searchParams.get('sku')?.trim()
  if (!sku) {
    return NextResponse.json({ error: 'sku is required' }, { status: 400 })
  }

  const result = await checkInventory(sku)
  if (!result) {
    return NextResponse.json({ type: 'inventory_not_found' as const, sku })
  }

  const stockMap = (result.stock_by_size ?? {}) as Record<string, number>
  const availableSizes = Object.entries(stockMap)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => ({ size, qty }))
  const totalStock = Object.values(stockMap).reduce(
    (sum: number, q: unknown) => sum + (q as number),
    0
  )

  return NextResponse.json({
    type: 'size_picker' as const,
    productId: (result.product_id as string) ?? '',
    title: (result.title as string) ?? '',
    sku: (result.sku as string) ?? sku,
    stockBySize: stockMap,
    availableSizes,
    totalStock,
    isLowStock: totalStock < 5,
    isActive: (result.is_active as boolean) ?? true,
  })
}
