import { getModel } from '@/lib/ai/llm'
import { generateText } from 'ai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateTextEmbedding, buildProductTextDocument, hashContent, fuseEmbeddings } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'

export const maxDuration = 120  // Vision + embedding can take time

/**
 * POST /api/admin/update
 *
 * Product Update Pipeline:
 * 1. Verify user session & merchant profile
 * 2. Retrieve existing product, verifying ownership
 * 3. Handle image upload if a new image file is provided
 * 4. Regenerate text embedding and combined embedding based on edited fields
 * 5. Update product row and upsert product embedding row in DB
 * 6. Return success
 */
export async function POST(request: Request) {
  const userClient = await createClient()

  // Verify the requester is authenticated (seller role)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify that the user has a merchant profile in the database
  const { data: merchantProfile } = await userClient
    .from('merchant_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!merchantProfile) {
    return NextResponse.json({ error: 'Unauthorized: Not a merchant' }, { status: 403 })
  }

  const supabase = await createAdminClient()

  try {
    const formData = await request.formData()

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const price = parseFloat(formData.get('price') as string)
    const sku = formData.get('sku') as string
    const category = formData.get('category') as string
    const brand = formData.get('brand') as string
    const description = formData.get('description') as string
    const material = formData.get('material') as string
    const stock = parseInt(formData.get('stock') as string, 10)
    const files = formData.getAll('images') as File[]

    if (!id || !title || isNaN(price) || !sku) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, price, sku' },
        { status: 400 }
      )
    }

    // ── Fetch original product ─────────────────────────────────────────
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    let fetchQuery = supabase.from('products').select('*')
    if (isUuid) {
      fetchQuery = fetchQuery.eq('id', id)
    } else {
      fetchQuery = fetchQuery.eq('sku', id)
    }

    const { data: product, error: fetchError } = await fetchQuery.maybeSingle()
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify ownership (must match user.id or be null)
    if (product.seller_id !== user.id && product.seller_id !== null) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this product' }, { status: 403 })
    }

    let imageUrls = product.image_urls || []
    let imageEmbedding: number[] | null = null
    let aiMetadata: any = (product.ai_metadata && typeof product.ai_metadata === 'object' && !Array.isArray(product.ai_metadata))
      ? product.ai_metadata
      : {}

    // ── Check if a new file is uploaded ──────────────────────────────
    const hasNewImage = files && files.length > 0 && files[0].size > 0

    if (hasNewImage) {
      // Ensure storage bucket exists
      try {
        const { data: buckets } = await supabase.storage.listBuckets()
        const hasBucket = buckets?.some(b => b.id === 'product-images')
        if (!hasBucket) {
          await supabase.storage.createBucket('product-images', { public: true })
        }
      } catch (e) {
        console.warn('[update] Could not ensure storage bucket exists:', e)
      }

      imageUrls = []
      for (const file of files.slice(0, 4)) {
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const fileName = `products/${sku}/${Date.now()}_${file.name.replace(/\s/g, '_')}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: true,
          })

        if (uploadError) {
          console.error('[update] Storage upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path)

        imageUrls.push(publicUrl)
      }

      if (imageUrls.length === 0) {
        return NextResponse.json({ error: 'Image upload failed' }, { status: 500 })
      }

      // Call Gemini Vision to extract metadata for new image
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
        console.warn('[update] Gemini Vision call failed. Keeping existing metadata or using defaults.', e)
        aiMetadata = {
          ...aiMetadata,
          image_caption: title,
        }
      }

      // Generate new image embedding from the caption
      if (aiMetadata.image_caption) {
        try {
          imageEmbedding = await generateTextEmbedding(aiMetadata.image_caption)
        } catch (e) {
          console.warn('[update] Image embedding generation failed:', e)
        }
      }
    } else {
      // Reuse existing image embedding
      const { data: oldEmb } = await supabase
        .from('product_embeddings')
        .select('image_embedding')
        .eq('product_id', product.id)
        .maybeSingle()
      
      if (oldEmb && oldEmb.image_embedding) {
        // Parse PG vector if returned as string (or array)
        imageEmbedding = typeof oldEmb.image_embedding === 'string'
          ? JSON.parse(oldEmb.image_embedding)
          : oldEmb.image_embedding
      }
    }

    // ── Generate new text embedding ──────────────────────────────────
    const textDocument = buildProductTextDocument({
      title,
      description: description || aiMetadata.description || product.description,
      category: category || aiMetadata.category || product.category,
      material_composition: material || aiMetadata.material_composition || product.material_composition,
      brand: brand || product.brand,
      tags: aiMetadata.tags || product.tags,
      colors: aiMetadata.colors || product.colors,
      gender: aiMetadata.gender || product.gender,
      sub_category: aiMetadata.sub_category || product.sub_category,
    })

    const contentHash = hashContent(textDocument)

    let textEmbedding: number[] | null = null
    try {
      textEmbedding = await generateTextEmbedding(textDocument)
    } catch (e) {
      console.warn('[update] Text embedding generation failed:', e)
    }

    // ── Fuse embeddings ──────────────────────────────────────────────
    let combinedEmbedding: number[] | null = null
    if (textEmbedding) {
      combinedEmbedding = fuseEmbeddings(
        textEmbedding,
        imageEmbedding,
        0.6,
        0.4
      )
    }

    // ── Update database products table ──────────────────────────────
    const { error: updateError } = await supabase
      .from('products')
      .update({
        title,
        price,
        sku,
        description: description || null,
        category: category || null,
        brand: brand || 'LuxeLabel',
        material_composition: material || null,
        stock_by_size: { M: isNaN(stock) ? 10 : stock },
        image_urls: imageUrls,
        ai_metadata: aiMetadata as unknown as import('@/lib/supabase/types').Json,
        seller_id: user.id, // Transfers ownership if it was null
        vector_status: textEmbedding ? 'ACTIVE' : 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)

    if (updateError) {
      console.error('[update] Product update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // ── Upsert embedding row ─────────────────────────────────────────
    if (textEmbedding) {
      const { error: embeddingError } = await supabase
        .from('product_embeddings')
        .upsert({
          product_id: product.id,
          text_embedding: textEmbedding,
          image_embedding: imageEmbedding,
          combined_embedding: combinedEmbedding,
          content_hash: contentHash,
          model_version: 'text-embedding-004',
        }, { onConflict: 'product_id' })

      if (embeddingError) {
        console.error('[update] Embedding upsert error:', embeddingError)
        await supabase
          .from('products')
          .update({ vector_status: 'FAILED' })
          .eq('id', product.id)
      } else {
        await supabase
          .from('products')
          .update({ vector_status: 'ACTIVE' })
          .eq('id', product.id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[update] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error during product update' },
      { status: 500 }
    )
  }
}
