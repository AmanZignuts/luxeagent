import { z } from 'zod'
import { checkInventory } from '@/lib/ai/search'

export const inventorySchema = z.object({
  sku: z.string().describe('The product SKU to check inventory for'),
})

export async function checkInventoryExecute(params: z.infer<typeof inventorySchema>) {
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
