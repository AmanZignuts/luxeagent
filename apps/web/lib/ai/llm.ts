import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'

let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null
let groqInstance: ReturnType<typeof createGroq> | null = null

function getGoogleInstance(): ReturnType<typeof createGoogleGenerativeAI> {
  if (!googleInstance) {
    googleInstance = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
  }
  return googleInstance
}

function getGroqInstance(): ReturnType<typeof createGroq> {
  if (!groqInstance) {
    groqInstance = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }
  return groqInstance
}

/**
 * Returns the configured LLM model instance for chat or vision tasks.
 * Supports switching between Groq and Google Gemini via the LLM_PROVIDER env variable.
 */
export function getModel(type: 'chat' | 'vision') {
  const provider = process.env.LLM_PROVIDER || 'groq'

  if (provider === 'google') {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    return getGoogleInstance()(modelName)
  } else {
    if (type === 'chat') {
      const modelName = "llama-3.1-8b-instant"
      return getGroqInstance()(modelName)
    } else {
      const modelName = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview'
      return getGroqInstance()(modelName)
    }
  }
}

/**
 * Returns the embedding model instance.
 * Since Groq does not offer text embedding models, this defaults to Google's gemini-embedding-2.
 */
export function getEmbeddingModel() {
  return getGoogleInstance().textEmbeddingModel('gemini-embedding-2')
}
