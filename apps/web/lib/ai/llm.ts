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
    console.log(`[llm] Provider: google | Model: ${modelName} | Type: ${type}`)
    return getGoogleInstance()(modelName)
  } else if (provider === 'openai') {
    if (type === 'chat') {
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      console.log(`[llm] Provider: openai | Model: ${modelName} | Type: ${type}`)
      return getOpenAIInstance()(modelName)
    } else {
      const modelName = process.env.OPENAI_VISION_MODEL || 'gpt-4o'
      console.log(`[llm] Provider: openai | Model: ${modelName} | Type: ${type}`)
      return getOpenAIInstance()(modelName)
    }
  } else {
    // ── Groq (default fallback) ──
    // NOTE: Free tier is capped at 6,000 TPM on llama-3.1-8b-instant.
    // This smaller model also has weaker tool-call schema adherence vs Gemini.
    // Commented out chat model override — set GROQ_CHAT_MODEL in env to change.
    if (type === 'chat') {
      const modelName = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant'
      // const modelName = 'llama-3.3-70b-versatile' // ← uncomment for better quality on Groq
      console.log(`[llm] Provider: groq | Model: ${modelName} | Type: ${type}`)
      return getGroqInstance()(modelName)
    } else {
      const modelName = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
      console.log(`[llm] Provider: groq | Model: ${modelName} | Type: ${type}`)
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
