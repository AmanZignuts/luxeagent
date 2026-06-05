import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'
import { generateTextEmbedding, buildProductTextDocument, hashContent, fuseEmbeddings } from '../lib/ai/embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env.local.')
  process.exit(1)
}

// Create admin client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('Fetching PENDING products for embedding generation...')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('vector_status', ['PENDING', 'FAILED'])

  if (error) {
    console.error('Error fetching products:', error)
    process.exit(1)
  }

  if (!products || products.length === 0) {
    console.log('No PENDING products found.')
    return
  }

  console.log(`Found ${products.length} products to process.`)

  for (const product of products) {
    console.log(`\nProcessing Product: ${product.title} (SKU: ${product.sku})...`)
    
    try {
      // 1. Build text document
      const textDocument = buildProductTextDocument({
        title: product.title,
        description: product.description,
        tags: product.tags,
        category: product.category,
        sub_category: product.sub_category,
        colors: product.colors,
        material_composition: product.material_composition,
        brand: product.brand,
        gender: product.gender,
      })

      const contentHash = hashContent(textDocument)

      // 2. Generate text embedding
      console.log('Generating text embedding...')
      const textEmbedding = await generateTextEmbedding(textDocument)

      // 3. Generate image embedding if image_caption exists in ai_metadata
      let imageEmbedding: number[] | null = null
      const aiMetadata = product.ai_metadata as any
      if (aiMetadata && aiMetadata.image_caption) {
        console.log('Generating image embedding from caption:', aiMetadata.image_caption)
        try {
          imageEmbedding = await generateTextEmbedding(aiMetadata.image_caption)
        } catch (e) {
          console.warn('Image embedding generation failed, using text embedding only:', e)
        }
      }

      // 4. Fuse embeddings
      const combinedEmbedding = fuseEmbeddings(textEmbedding, imageEmbedding)

      // 5. Upsert to product_embeddings
      console.log('Saving embeddings to database...')
      const { error: embedError } = await supabase
        .from('product_embeddings')
        .upsert({
          product_id: product.id,
          text_embedding: textEmbedding,
          image_embedding: imageEmbedding,
          combined_embedding: combinedEmbedding,
          content_hash: contentHash,
          model_version: 'gemini-embedding-2',
        }, { onConflict: 'product_id' })

      if (embedError) {
        throw new Error(`Embedding insert error: ${embedError.message}`)
      }

      // 6. Mark product status as ACTIVE
      const { error: updateError } = await supabase
        .from('products')
        .update({ vector_status: 'ACTIVE' })
        .eq('id', product.id)

      if (updateError) {
        throw new Error(`Product status update error: ${updateError.message}`)
      }

      console.log(`Successfully embedded product ${product.sku} (status set to ACTIVE).`)

    } catch (err: any) {
      console.error(`Failed to process product ${product.sku}:`, err.message || err)
      
      // Update status to FAILED
      await supabase
        .from('products')
        .update({ vector_status: 'FAILED' })
        .eq('id', product.id)
    }
  }

  console.log('\nEmbedding generation completed!')
}

run()
