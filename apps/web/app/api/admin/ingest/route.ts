import { getModel } from '@/lib/ai/llm'
import { generateText } from 'ai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateTextEmbedding, buildProductTextDocument, hashContent, fuseEmbeddings } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'

export const maxDuration = 120  // Vision + embedding can take time

/**
 * POST /api/admin/ingest
 *
 * Vision LLM Product Ingestion Pipeline:
 * 1. Receive multipart form with: title, price, sku, images[]
 * 2. Upload images to Supabase Storage
 * 3. Call Gemini Vision to extract: description, category, tags, colors, material
 * 4. Generate text embedding (title + extracted metadata)
 * 5. Generate image description → embed it (image embedding)
 * 6. Fuse embeddings (60% text + 40% image)
 * 7. INSERT product + product_embeddings
 * 8. Return { success, productId }
 */
export async function POST(request: Request) {
  const userClient = await createClient()

  // Verify the requester is authenticated (seller role)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  try {
    const formData = await request.formData()

    // ── Extract form fields ──────────────────────────────────────────
    const title   = formData.get('title') as string
    const price   = parseFloat(formData.get('price') as string)
    const sku     = formData.get('sku') as string
    const files   = formData.getAll('images') as File[]

    if (!title || !price || !sku || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, sku, images' },
        { status: 400 }
      )
    }

    // ── Step 1: Ensure storage bucket exists & upload images ──────────
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const hasBucket = buckets?.some(b => b.id === 'product-images')
      if (!hasBucket) {
        await supabase.storage.createBucket('product-images', {
          public: true,
        })
      }
    } catch (e) {
      console.warn('[ingest] Could not ensure storage bucket exists:', e)
    }

    const imageUrls: string[] = []
    for (const file of files.slice(0, 4)) {  // max 4 images per product
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileName = `products/${sku}/${Date.now()}_${file.name.replace(/\s/g, '_')}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('[ingest] Storage upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(uploadData.path)

      imageUrls.push(publicUrl)
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'All image uploads failed' }, { status: 500 })
    }

    // ── Step 2: Gemini Vision — extract structured metadata ──────────
    const primaryImageUrl = imageUrls[0]

    const visionPrompt = `You are analyzing a luxury fashion product image for a high-end e-commerce platform.

Analyze this product image and return a JSON object with ONLY these exact fields:
{
  "description": "2-3 sentence editorial product description",
  "category": one of ["dresses", "tops", "outerwear", "trousers", "accessories"],
  "sub_category": "specific sub-category (e.g. midi-dress, turtleneck, blazer, tote)",
  "gender": one of ["women", "men", "unisex"],
  "colors": ["array", "of", "color", "names"],
  "tags": ["array", "of", "style", "tags"],
  "material_composition": "best guess at material if visible",
  "image_caption": "one detailed sentence describing visual appearance for embedding"
}

Return ONLY valid JSON. No markdown, no explanation.`

    let aiMetadata: {
      description?: string
      category?: string
      sub_category?: string
      gender?: string
      colors?: string[]
      tags?: string[]
      material_composition?: string
      image_caption?: string
    } = {}

    try {
      const { text: visionResponse } = await generateText({
        model: getModel('vision'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', image: primaryImageUrl },
              { type: 'text', text: visionPrompt },
            ],
          },
        ],
      })
      const cleaned = visionResponse.replace(/```json\n?|\n?```/g, '').trim()
      aiMetadata = JSON.parse(cleaned)
    } catch (e) {
      console.warn('[ingest] Gemini Vision model call failed (likely quota limit). Using defaults.', e)
      aiMetadata = {
        description: title,
        category: 'tops',
        sub_category: 'apparel',
        gender: 'unisex',
        tags: [],
        colors: [],
        material_composition: '',
        image_caption: title,
      }
    }

    // ── Step 3: Build text document + generate text embedding ────────
    const textDocument = buildProductTextDocument({
      title,
      description: aiMetadata.description,
      tags: aiMetadata.tags,
      category: aiMetadata.category,
      sub_category: aiMetadata.sub_category,
      colors: aiMetadata.colors,
      material_composition: aiMetadata.material_composition,
      gender: aiMetadata.gender,
    })

    const contentHash = hashContent(textDocument)

    let textEmbedding: number[] | null = null
    try {
      textEmbedding = await generateTextEmbedding(textDocument)
    } catch (e) {
      console.warn('[ingest] Text embedding generation failed (likely quota limit):', e)
    }

    // ── Step 4: Image embedding (caption → text embedding) ───────────
    let imageEmbedding: number[] | null = null
    if (aiMetadata.image_caption) {
      try {
        imageEmbedding = await generateTextEmbedding(aiMetadata.image_caption)
      } catch (e) {
        console.warn('[ingest] Image embedding generation failed (likely quota limit):', e)
      }
    }

    // ── Step 5: Fuse embeddings ──────────────────────────────────────
    let combinedEmbedding: number[] | null = null
    if (textEmbedding) {
      combinedEmbedding = fuseEmbeddings(
        textEmbedding,
        imageEmbedding,
        0.6,
        0.4
      )
    }

    // ── Step 6: INSERT product into database ─────────────────────────
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        sku,
        title,
        price,
        description: aiMetadata.description ?? null,
        category: aiMetadata.category ?? null,
        sub_category: aiMetadata.sub_category ?? null,
        gender: aiMetadata.gender ?? 'women',
        tags: aiMetadata.tags ?? [],
        colors: aiMetadata.colors ?? [],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        image_urls: imageUrls,
        stock_by_size: { XS: 10, S: 15, M: 20, L: 15, XL: 10 },
        material_composition: aiMetadata.material_composition ?? null,
        ai_metadata: aiMetadata as unknown as import('@/lib/supabase/types').Json,
        vector_status: textEmbedding ? 'PENDING' : 'FAILED',
        seller_id: user.id,
      })
      .select()
      .single()

    if (productError) {
      console.error('[ingest] Product insert error:', productError)
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // ── Step 7: INSERT product embedding ────────────────────────────
    if (textEmbedding) {
      const { error: embeddingError } = await supabase
        .from('product_embeddings')
        .insert({
          product_id: product.id,
          text_embedding: textEmbedding,
          image_embedding: imageEmbedding,
          combined_embedding: combinedEmbedding,
          content_hash: contentHash,
          model_version: 'text-embedding-004',
        })

      if (embeddingError) {
        console.error('[ingest] Embedding insert error:', embeddingError)
        // Product created but embedding failed — mark status as FAILED
        await supabase
          .from('products')
          .update({ vector_status: 'FAILED' })
          .eq('id', product.id)
      } else {
        // ── Step 8: Mark product as ACTIVE ───────────────────────────────
        await supabase
          .from('products')
          .update({ vector_status: 'ACTIVE' })
          .eq('id', product.id)
      }
    }

    return NextResponse.json({
      success: true,
      productId: product.id,
      sku: product.sku,
      title: product.title,
      imageUrls,
      aiMetadata,
      vectorStatus: textEmbedding ? 'ACTIVE' : 'FAILED',
    })


  } catch (error) {
    console.error('[ingest] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error during ingestion' },
      { status: 500 }
    )
  }
}
