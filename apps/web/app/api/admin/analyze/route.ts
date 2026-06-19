import { getModel } from '@/lib/ai/llm'
import { generateText } from 'ai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 120  // Vision API calls can take some time

/**
 * POST /api/admin/analyze
 *
 * Vision Analysis Pipeline:
 * 1. Receive multipart form with image file
 * 2. Upload image to Supabase Storage in product-images bucket
 * 3. Call Gemini Vision to extract product metadata
 * 4. Return { success: true, imageUrl, aiMetadata }
 */
export async function POST(request: Request) {
  const userClient = await createClient()

  // Verify requester is authenticated
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify merchant profile exists
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
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'Missing required field: image' }, { status: 400 })
    }

    // Ensure storage bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const hasBucket = buckets?.some(b => b.id === 'product-images')
      if (!hasBucket) {
        await supabase.storage.createBucket('product-images', {
          public: true,
        })
      }
    } catch (e) {
      console.warn('[analyze] Could not ensure storage bucket exists:', e)
    }

    // Upload to a temp path for preview
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `temp-preview/${Date.now()}_${file.name.replace(/\s/g, '_')}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[analyze] Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Image upload failed: ' + uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData.path)

    // Call Gemini Vision to extract metadata
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

    let aiMetadata = {}
    try {
      const { text: visionResponse } = await generateText({
        model: getModel('vision'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', image: publicUrl },
              { type: 'text', text: visionPrompt },
            ],
          },
        ],
      })
      const cleaned = visionResponse.replace(/```json\n?|\n?```/g, '').trim()
      aiMetadata = JSON.parse(cleaned)
    } catch (e) {
      console.warn('[analyze] Gemini Vision call failed:', e)
      // Fallback in case of model issue or quota limit
      aiMetadata = {
        description: '',
        category: 'tops',
        sub_category: '',
        gender: 'unisex',
        tags: [],
        colors: [],
        material_composition: '',
        image_caption: '',
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      aiMetadata,
    })

  } catch (error) {
    console.error('[analyze] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error during analysis' }, { status: 500 })
  }
}
