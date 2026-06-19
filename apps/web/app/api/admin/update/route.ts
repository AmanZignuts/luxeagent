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
    const brand = formData.get('brand') as string || 'LuxeLabel'
    const description = formData.get('description') as string
    const material = formData.get('material') as string
    const stock = parseInt(formData.get('stock') as string, 10)
    const files = formData.getAll('images') as File[]

    const subCategory = formData.get('sub_category') as string
    const gender = formData.get('gender') as string
    const tagsRaw = formData.get('tags') as string
    const colorsRaw = formData.get('colors') as string
    const imageCaption = formData.get('image_caption') as string
    const imageUrlsRaw = formData.get('image_urls') as string

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

    // ── Parse tags, colors, and image_urls if provided ───────────────
    let tags: string[] = product.tags || []
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch {
        tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      }
    }

    let colors: string[] = product.colors || []
    if (colorsRaw) {
      try {
        colors = JSON.parse(colorsRaw)
      } catch {
        colors = colorsRaw.split(',').map(c => c.trim()).filter(Boolean)
      }
    }

    let imageUrls = product.image_urls || []
    if (imageUrlsRaw) {
      try {
        imageUrls = JSON.parse(imageUrlsRaw)
      } catch {
        imageUrls = imageUrlsRaw.split(',').map(u => u.trim()).filter(Boolean)
      }
    }

    let imageEmbedding: number[] | null = null
    let aiMetadata: any = (product.ai_metadata && typeof product.ai_metadata === 'object' && !Array.isArray(product.ai_metadata))
      ? product.ai_metadata
      : {}

    const hasPreAnalyzedMetadata = !!category && !!description

    // ── Check if a new file is uploaded ──────────────────────────────
    const hasNewImage = files && files.length > 0 && files[0] instanceof File && files[0].size > 0

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

      const uploadedUrls: string[] = []
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

        uploadedUrls.push(publicUrl)
      }

      if (uploadedUrls.length > 0) {
        imageUrls = [...uploadedUrls, ...imageUrls]
      }

      if (imageUrls.length === 0) {
        return NextResponse.json({ error: 'Image upload failed' }, { status: 500 })
      }

      // If pre-analyzed metadata is not passed, run Gemini Vision on new image
      if (!hasPreAnalyzedMetadata) {
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
      } else {
        // Use passed metadata
        aiMetadata = {
          description,
          category,
          sub_category: subCategory || product.sub_category || '',
          gender: gender || product.gender || 'women',
          colors,
          tags,
          material_composition: material || '',
          image_caption: imageCaption || title,
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
      // No new image file. Check if they updated metadata anyway
      if (hasPreAnalyzedMetadata) {
        aiMetadata = {
          description,
          category,
          sub_category: subCategory || product.sub_category || '',
          gender: gender || product.gender || 'women',
          colors,
          tags,
          material_composition: material || '',
          image_caption: imageCaption || title,
        }

        // Re-generate image embedding if caption changed
        if (aiMetadata.image_caption && aiMetadata.image_caption !== (product.ai_metadata as any)?.image_caption) {
          try {
            imageEmbedding = await generateTextEmbedding(aiMetadata.image_caption)
          } catch (e) {
            console.warn('[update] Image embedding generation failed on caption change:', e)
          }
        }
      }

      // Reuse existing image embedding if not newly generated
      if (!imageEmbedding) {
        const { data: oldEmb } = await supabase
          .from('product_embeddings')
          .select('image_embedding')
          .eq('product_id', product.id)
          .maybeSingle()
        
        if (oldEmb && oldEmb.image_embedding) {
          imageEmbedding = typeof oldEmb.image_embedding === 'string'
            ? JSON.parse(oldEmb.image_embedding)
            : oldEmb.image_embedding
        }
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

    const sizesRaw = formData.get('sizes') as string
    const stockBySizeRaw = formData.get('stock_by_size') as string

    let sizes: string[] = product.sizes || ['XS', 'S', 'M', 'L', 'XL']
    if (sizesRaw) {
      try {
        sizes = JSON.parse(sizesRaw)
      } catch {
        sizes = sizesRaw.split(',').map(s => s.trim()).filter(Boolean)
      }
    }

    let stockBySize: Record<string, number> = {}
    if (stockBySizeRaw) {
      try {
        stockBySize = JSON.parse(stockBySizeRaw)
      } catch {
        console.error('Failed to parse stock_by_size JSON:', stockBySizeRaw)
      }
    }

    // Fallback: If stock_by_size is empty but stock is provided, distribute stock
    if (Object.keys(stockBySize).length === 0) {
      const stockVal = isNaN(stock) ? 10 : stock
      const stockXS = Math.floor(stockVal * 0.15)
      const stockS = Math.floor(stockVal * 0.2)
      const stockM = Math.floor(stockVal * 0.3)
      const stockL = Math.floor(stockVal * 0.2)
      const stockXL = stockVal - (stockXS + stockS + stockM + stockL)
      stockBySize = { XS: stockXS, S: stockS, M: stockM, L: stockL, XL: stockXL }
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
        sizes: sizes,
        stock_by_size: stockBySize,
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
