import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('No GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY found.')
    return
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const data = await res.json()
    console.log('Available Models:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error fetching models:', err)
  }
}

listModels()
