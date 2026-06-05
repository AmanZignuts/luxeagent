import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { getEmbeddingModel } from '../apps/web/lib/ai/llm'
import { embed } from 'ai'

async function test() {
  try {
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: 'Hello world',
      providerOptions: {
        google: {
          outputDimensionality: 768,
        },
      },
    })
    console.log('Embedding length:', embedding.length)
  } catch (err) {
    console.error('Error during embedding:', err)
  }
}

test()
