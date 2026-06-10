import { getModel } from '@/lib/ai/llm'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { agentTools, stepCountIs } from '@/lib/ai/tools'
import { isQuotaError, markQuotaExceeded, parseRetryAfterSeconds } from '@/lib/ai/quota'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'

export const maxDuration = 60  // seconds

const SYSTEM_PROMPT = `You are LuxeAgent, an elite, decisive fashion concierge for Vestira.
You assist ONLY with styling, fashion curation, wardrobe, and our product catalog.

Strict Out-of-Scope Rule (CRITICAL):
- If the user asks about ANYTHING out-of-scope (e.g., economics, math, history, politics, code, general knowledge), you MUST immediately and strictly refuse with EXACTLY: "I am only calibrated to assist with fashion styling, wardrobe curation, and our product catalog."
- NEVER answer, explain, or suggest options/alternatives for out-of-scope topics. Keep it to a strict refusal only.

Decisive Styling & Curation (CRITICAL):
- Be a confident, authoritative stylist. Never ask the user to choose between options, and never ask "Would you like me to refine this?" or "Should I explore X instead?".
- Present products immediately. If a user asks for a category/item, call the tool and show them.
- Curate with confidence: Never complain that the found items don't perfectly match the query type (e.g. if you find formal dresses for a summer query, present them confidently as luxury summer-appropriate options). Do not ask if you should refine.
- Never ask yes/no or clarification questions. If the query is ambiguous or asks for two things, pick the most recent or best one, call the tool, and show the results.

Token Optimization:
- Limit conversational text to 1-2 sentences. Avoid filler, fluff, or phrases like "Great question!" or "Of course!".

Tool Rules:
- searchProducts: Catalog searches. Set category (dresses, tops, trousers, outerwear, accessories) and price limits. Do not invent products.
- recommendByOccasion: Occasion in (wedding, office, vacation, date night, party, casual).
- generateOutfitLook: Head-to-toe outfit. Set totalBudgetMax.
- findSimilarProducts: Visual search (after upload).
- getPersonalizedRecommendations: Style profile recommendations.
- compareProducts, checkInventory, getProductDetails, addToBag, getOrderStatus: Specific user actions.

Curation Rules:
- No tool calls for general chat/advice.
- Do not trigger searches after add-to-bag/confirmations.
- When calling a tool, output ONLY the tool call. No introductory/outro text.
- Catalog items must come from tool results. Never invent products/SKUs.`

export async function POST(request: Request) {
  let messages: UIMessage[] = []

  try {
    const body = await request.json()
    messages = (body.messages ?? []) as UIMessage[]
    const { chatId } = body

    console.log('[chat/route] Received request:', {
      messagesCount: messages?.length,
      chatId,
      bodyKeys: Object.keys(body),
    })

    const provider = process.env.LLM_PROVIDER || 'groq'
    let hasApiKey = false
    let providerName = 'Groq'

    if (provider === 'groq') {
      hasApiKey = !!process.env.GROQ_API_KEY
      providerName = 'Groq'
    } else if (provider === 'openai') {
      hasApiKey = !!process.env.OPENAI_API_KEY
      providerName = 'OpenAI'
    } else {
      hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
      providerName = 'Gemini'
    }

    if (!hasApiKey) {
      console.warn(`[chat/route] API key is missing for provider: ${provider}`)
      return new Response(
        JSON.stringify({
          error: 'MISSING_API_KEY',
          message: `${providerName} API key is not configured.`
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
      const modelMessages = await convertToModelMessages(messages)

      const result = streamText({
        model: getModel('chat'),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: agentTools,
        stopWhen: stepCountIs(5),
        maxRetries: 0,
        providerOptions: {
          groq: {
            parallelToolCalls: false,
          },
        },
      })

      return result.toUIMessageStreamResponse({
        originalMessages: messages,
        onFinish: async ({ messages: updatedMessages }) => {
          console.log('[chat/route] Stream finished')
          if (user && chatId) {
            try {
              await supabase.from('chat_sessions').upsert({
                id: chatId as string,
                user_id: user.id,
                messages: updatedMessages as unknown as Json,
                updated_at: new Date().toISOString(),
              })
            } catch (err) {
              console.error('[chat/route] Failed to persist chat session:', err)
            }
          }
        },
      })
    } catch (err) {
      console.error('[chat/route] Error during streamText execution:', err)

      if (isQuotaError(err)) {
        markQuotaExceeded(parseRetryAfterSeconds(err))
        console.warn('[chat/route] Quota limit hit.')
        return new Response(
          JSON.stringify({ error: 'QUOTA_EXCEEDED', message: 'Gemini API quota exceeded.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      throw err
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[chat/route] Fatal error in POST handler:', error)

    if (isQuotaError(error)) {
      markQuotaExceeded(parseRetryAfterSeconds(error))
      return new Response(
        JSON.stringify({ error: 'QUOTA_EXCEEDED', message: 'Gemini API quota exceeded.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message,
        details: String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
