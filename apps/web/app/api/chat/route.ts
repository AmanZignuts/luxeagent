import { getModel } from '@/lib/ai/llm'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { agentTools, stepCountIs } from '@/lib/ai/tools'
import { isQuotaError, markQuotaExceeded, parseRetryAfterSeconds } from '@/lib/ai/quota'
import { runMockAgent } from '@/lib/ai/mock-agent'
import { createClient } from '@/lib/supabase/server'
import { setImageForChat, clearImageForChat } from '@/lib/ai/image-store'
import type { Json } from '@/lib/supabase/types'

export const maxDuration = 60  // seconds

const SYSTEM_PROMPT_TEMPLATE = `You are LuxeAgent, an elite, decisive fashion concierge representing the Vestira atelier.
You assist ONLY with styling, fashion curation, wardrobe, and our product catalog.

Brand Voice & Perspective (CRITICAL):
- ALWAYS write from the perspective of the house/atelier/business. Use collective terms like "we", "our", and "us".
- NEVER use first-person singular pronouns like "I", "me", "my", or "myself".
- Maintain a warm, polite, and simple conversational tone. Avoid overly formal, flowery, or stuffy corporate language (e.g., do NOT use phrases like "delighted to assist you", "capture a similarly elevated aesthetic", or "for your consideration").
- Be direct and simple: if an item is unavailable or out of budget, state it plainly and politely, and introduce alternatives simply (e.g., "We don't have jackets under ₹1,000, but we found these alternate options that you might like instead.").
- Never use defensive or rude phrasing like "As previously mentioned" or "As I said".

Strict Out-of-Scope Rule (CRITICAL):
- If the user asks about ANYTHING out-of-scope (e.g., economics, math, history, politics, code, general knowledge), you MUST immediately and strictly refuse with EXACTLY: "We are only calibrated to assist with fashion styling, wardrobe curation, and our product catalog."
- NEVER answer, explain, or suggest options/alternatives for out-of-scope topics. Keep it to a strict refusal only.

Decisive Styling & Curation (CRITICAL):
- Be a confident, authoritative stylist. Never ask the user to choose between options, and never ask "Would you like us to refine this?" or "Should we explore X instead?".
- Present products immediately. If a user asks for a category/item, specific price, or product name, you MUST call the appropriate tool to retrieve and show them. NEVER describe or mention a product in text without calling the corresponding tool (e.g., searchProducts) to present it visually in the preview showcase.
- Curate with confidence: Never complain that the found items don't perfectly match the query type. Present options confidently as luxury alternatives. Do not ask to refine.
- Never ask yes/no or clarification questions. If the query is ambiguous or asks for two things, pick the most recent or best one, call the tool, and show the results.

Token Optimization:
- Limit conversational text to 1-2 sentences. Avoid filler, fluff, or phrases like "Great question!" or "Of course!".

Curation Rules:
- No tool calls for general chat/advice.
- Do not trigger searches after add-to-bag/confirmations.
- When calling a tool, do not output introductory or outro text.
- Catalog items must come from tool results. NEVER talk about specific products/items or make recommendations in text without calling the search/curation tools (searchProducts, generateOutfitLook, checkInventory, compareProducts, etc.) to fetch and display the product preview panel on the right.Image Uploads / Visual Search:
- If the user uploads an image, they will provide a message starting with "[Image Upload]". Your model sees the image directly in the chat messages. You MUST:
  1. Examine the image content carefully.
  2. Check if the image visually matches one of the catalog products listed below:
__CATALOG_PRODUCTS_LIST__
     If the uploaded image matches one of these catalog products exactly (visually identical item, colors, patterns, and structure), identify its SKU.
  3. Formulate a RICH, DETAILED description of the uploaded image: exact garment type (t-shirt, blazer, dress, etc.), color(s), fabric, any graphic/print/text visible, brand name if readable, silhouette, and aesthetic.
  4. Call findSimilarProducts with:
     - imageDescription: your detailed visual description
     - chatId: "__CHAT_ID_PLACEHOLDER__" (use this exact value — it enables pixel-level fingerprint matching to find the EXACT product in our catalog)
     - exactSku: The SKU of the matched product if you identified it in step 2 (otherwise leave undefined/omit).
  NEVER omit chatId when searching with an image.`

function buildSystemPrompt(chatId: string, catalogProductsText: string): string {
  return SYSTEM_PROMPT_TEMPLATE
    .replace('__CHAT_ID_PLACEHOLDER__', chatId)
    .replace('__CATALOG_PRODUCTS_LIST__', catalogProductsText)
}




export async function POST(request: Request) {
  let messages: UIMessage[] = []
  let chatId = ''

  try {
    const body = await request.json()
    messages = (body.messages ?? []) as UIMessage[]
    chatId = body.chatId || ''
    const { mock, imageBase64 } = body

    // ── Backend Validation: Enforce maximum message length ──
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (latestUserMessage) {
      let userQueryText = ''
      if (Array.isArray(latestUserMessage.parts)) {
        userQueryText = latestUserMessage.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text || '')
          .join('')
      } else if (typeof (latestUserMessage as any).content === 'string') {
        userQueryText = (latestUserMessage as any).content
      }

      const MAX_CHAR_LIMIT = 1000
      if (userQueryText.length > MAX_CHAR_LIMIT) {
        return new Response(
          JSON.stringify({
            error: 'MESSAGE_TOO_LONG',
            message: `Your message exceeds the maximum allowed limit of ${MAX_CHAR_LIMIT} characters. Please shorten your query.`
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('[chat/route] Received request:', {
      messagesCount: messages?.length,
      chatId,
      bodyKeys: Object.keys(body),
    })

    const isMockMode = mock === true || process.env.AI_USE_MOCK === 'true'

    if (isMockMode) {
      console.log('[chat/route] Operating in mock/demo fallback mode')
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      let userQuery = ''
      if (lastUserMessage) {
        if (Array.isArray(lastUserMessage.parts)) {
          for (const part of lastUserMessage.parts) {
            if (part.type === 'text') {
              userQuery = (part as any).text || ''
              break
            }
          }
        }
        if (!userQuery && typeof (lastUserMessage as any).content === 'string') {
          userQuery = (lastUserMessage as any).content
        }
      }
      return runMockAgent(userQuery, chatId, messages)
    }

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

    // Fetch active catalog products to inject into system prompt for visual matching
    const { data: activeProducts } = await supabase
      .from('products')
      .select('sku, title, brand, category, colors, description')
      .eq('is_active', true)

    const catalogProductsText = (activeProducts ?? []).map(p => 
      `- SKU: ${p.sku} | Title: ${p.title} | Brand: ${p.brand} | Category: ${p.category} | Colors: ${p.colors?.join(', ')} | Description: ${p.description}`
    ).join('\n')

    try {
      const modelMessages = await convertToModelMessages(messages)

      // Register uploaded image for this chat session (used by findSimilarProducts tool)
      if (imageBase64 && chatId) {
        setImageForChat(chatId, imageBase64)
      }

      // Detect if the latest user message contains an image part → use vision model
      const latestUserMsg = [...messages].reverse().find(m => m.role === 'user')
      const hasImagePart = latestUserMsg?.parts?.some((p: any) =>
        p.type === 'file' || p.type === 'image' ||
        (p.type === 'text' && (p.text as string)?.startsWith('[Image Upload]'))
      ) ?? false
      const modelType = hasImagePart ? 'vision' : 'chat'
      console.log(`[chat/route] Using model type: ${modelType} (hasImagePart=${hasImagePart})`)

      const result = streamText({
        model: getModel(modelType),
        system: buildSystemPrompt(chatId, catalogProductsText),
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
          JSON.stringify({ error: 'QUOTA_EXCEEDED', message: err instanceof Error ? err.message : 'Gemini API quota exceeded.' }),
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
        JSON.stringify({ error: 'QUOTA_EXCEEDED', message: error instanceof Error ? error.message : 'Gemini API quota exceeded.' }),
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
