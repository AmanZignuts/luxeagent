const DEFAULT_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL'] as const

/** First size with stock > 0, preferring catalog size order. */
export function firstInStockSize(
  stockBySize: Record<string, number>,
  preferredOrder: string[] = [...DEFAULT_SIZE_ORDER]
): string | null {
  for (const size of preferredOrder) {
    if ((stockBySize[size] ?? 0) > 0) return size
  }
  const any = Object.entries(stockBySize).find(([, qty]) => qty > 0)
  return any?.[0] ?? null
}
