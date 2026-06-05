import { getEmbeddingModel } from '@/lib/ai/llm'
import { embed } from 'ai'
import crypto from 'crypto'

/**
 * Generates a 768-dimensional text embedding using Google's gemini-embedding-2 model.
 * Used for hybrid search and image caption embeddings.
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: 768,
      },
    },
  })
  return embedding
}

/**
 * Builds a rich text document from product fields for embedding.
 * Field weighting (via repetition):
 * - title × 3 (most important)
 * - tags × 2
 * - category, sub_category, colors × 2
 * - description, material × 1
 */
export function buildProductTextDocument(product: {
  title: string
  description?: string | null
  tags?: string[]
  category?: string | null
  sub_category?: string | null
  colors?: string[]
  material_composition?: string | null
  brand?: string | null
  gender?: string | null
}): string {
  const parts: string[] = [
    // Title gets highest weight
    product.title,
    product.title,
    product.title,
    // Tags get second highest weight
    ...(product.tags ?? []),
    ...(product.tags ?? []),
    // Colors + category
    ...(product.colors ?? []),
    ...(product.colors ?? []),
    product.category ?? '',
    product.category ?? '',
    product.sub_category ?? '',
    product.sub_category ?? '',
    // Single weight fields
    product.description ?? '',
    product.material_composition ?? '',
    product.brand ?? '',
    product.gender ?? '',
  ]
  return parts.filter(Boolean).join(' ').trim()
}

/**
 * Generates a SHA-256 hash of the source text.
 * Used for deduplication — skip re-embedding if content hasn't changed.
 */
export function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * Fuses text and image embeddings into a single combined vector.
 * Weights: 60% text, 40% image (text is more reliable; image adds visual context)
 * If only one embedding is available, returns it directly.
 */
export function fuseEmbeddings(
  textEmbedding: number[],
  imageEmbedding: number[] | null,
  textWeight = 0.6,
  imageWeight = 0.4
): number[] {
  if (!imageEmbedding || imageEmbedding.length === 0) {
    return textEmbedding
  }

  if (textEmbedding.length !== imageEmbedding.length) {
    console.warn('[embeddings] Dimension mismatch — returning text embedding only')
    return textEmbedding
  }

  return textEmbedding.map(
    (v, i) => textWeight * v + imageWeight * imageEmbedding[i]
  )
}
