import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null
let openaiInstance: ReturnType<typeof createOpenAI> | null = null

function getGoogleInstance(): ReturnType<typeof createGoogleGenerativeAI> {
  if (!googleInstance) {
    googleInstance = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
  }
  return googleInstance
}

function getOpenAIInstance(): ReturnType<typeof createOpenAI> {
  if (!openaiInstance) {
    openaiInstance = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

/**
 * Returns the configured LLM model instance for chat or vision tasks.
 * Supports switching between Google Gemini and OpenAI via the LLM_PROVIDER env variable.
 * Defaults to Google Gemini if LLM_PROVIDER is not set.
 */
export function getModel(type: 'chat' | 'vision') {
  const provider = process.env.LLM_PROVIDER || 'google'

  if (provider === 'openai') {
    if (type === 'chat') {
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      console.log(`[llm] Provider: openai | Model: ${modelName} | Type: ${type}`)
      return getOpenAIInstance()(modelName)
    } else {
      const modelName = process.env.OPENAI_VISION_MODEL || 'gpt-4o'
      console.log(`[llm] Provider: openai | Model: ${modelName} | Type: ${type}`)
      return getOpenAIInstance()(modelName)
    }
  }

  // Default: Google Gemini
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
  console.log(`[llm] Provider: google | Model: ${modelName} | Type: ${type}`)
  return getGoogleInstance()(modelName)
}

/**
 * Returns the embedding model instance (Google Gemini embeddings).
 */
export function getEmbeddingModel() {
  return getGoogleInstance().textEmbeddingModel('gemini-embedding-2')
}
