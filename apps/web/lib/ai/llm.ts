import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'

let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null
let groqInstance: ReturnType<typeof createGroq> | null = null
let openaiInstance: ReturnType<typeof createOpenAI> | null = null

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
 * Supports switching between Groq, Google Gemini, and OpenAI via the LLM_PROVIDER env variable.
 */
export function getModel(type: 'chat' | 'vision') {
  const provider = process.env.LLM_PROVIDER || 'groq'

  if (provider === 'google') {
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
    return getGoogleInstance()(modelName)
  } else if (provider === 'openai') {
    if (type === 'chat') {
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      return getOpenAIInstance()(modelName)
    } else {
      const modelName = process.env.OPENAI_VISION_MODEL || 'gpt-4o'
      return getOpenAIInstance()(modelName)
    }
  } else {
    if (type === 'chat') {
      const modelName = "llama-3.1-8b-instant"
      return getGroqInstance()(modelName)
    } else {
      const modelName = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
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
