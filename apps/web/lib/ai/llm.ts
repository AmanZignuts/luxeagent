import { createGoogleGenerativeAI } from '@ai-sdk/google'

let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getGoogleInstance(): ReturnType<typeof createGoogleGenerativeAI> {
  if (!googleInstance) {
    googleInstance = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
  }
  return googleInstance
}

/**
 * Returns the configured LLM model instance for chat or vision tasks (Google Gemini).
 */
export function getModel(type: 'chat' | 'vision') {
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
