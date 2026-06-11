import { agentTools } from './tools'
import { createClient } from '@/lib/supabase/server'
import type { UIMessage } from 'ai'

export async function runMockAgent(
  userQuery: string,
  chatId: string,
  messages: UIMessage[]
): Promise<Response> {
  const query = userQuery.toLowerCase().trim()

  let toolName: keyof typeof agentTools = 'searchProducts'
  let toolArgs: any = { query: userQuery }
  let introMessage = "Curating exceptional pieces from our collection..."
  let outroMessage = "Here are the curated selections matching your style. Let me know if you would like me to check sizing or add one to your bag."

  // 1. getUserStyleProfile
  if (query.includes('profile') || query.includes('preferences') || query.includes('persona')) {
    toolName = 'getUserStyleProfile'
    toolArgs = {}
    introMessage = "Retrieving your personal style preferences..."
    outroMessage = "Your fashion profile is active. Use these settings to tailor recommendations."
  }
  // 2. getOrderStatus
  else if (query.includes('order') || query.includes('status') || query.includes('delivery') || query.includes('track')) {
    toolName = 'getOrderStatus'
    const orderIdMatch = query.match(/order\s*#?([a-f0-9-]+)/i)
    toolArgs = { orderId: orderIdMatch ? orderIdMatch[1] : undefined }
    introMessage = "Checking your recent order status and delivery updates..."
    outroMessage = "Above are your order details. Let me know if you need help with returns or exchanges."
  }
  // 3. generateOutfitLook / outfit / style me
  else if (query.includes('outfit') || query.includes('look') || query.includes('style me') || query.includes('wardrobe')) {
    toolName = 'generateOutfitLook'
    
    let occasion = 'casual'
    if (query.includes('wedding') || query.includes('gala') || query.includes('formal')) occasion = 'gala'
    else if (query.includes('office') || query.includes('work') || query.includes('business')) occasion = 'office'
    else if (query.includes('weekend') || query.includes('brunch')) occasion = 'weekend'
    else if (query.includes('vacation') || query.includes('travel') || query.includes('beach')) occasion = 'vacation'
    
    let totalBudgetMax: number | undefined
    const budgetMatch = query.match(/(?:under|below|max|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i)
    if (budgetMatch) {
      totalBudgetMax = parseInt(budgetMatch[1], 10)
    }

    toolArgs = { occasion, totalBudgetMax, queryText: userQuery }
    introMessage = `Styling a custom ${occasion} look ${totalBudgetMax ? `within a budget of ₹${totalBudgetMax}` : ''}...`
    outroMessage = "I have put together this head-to-toe ensemble. You can select your sizes or swap any items."
  }
  // 4. compareProducts
  else if (query.includes('compare') || query.includes('versus') || query.includes(' vs ')) {
    toolName = 'compareProducts'
    const skuMatches = userQuery.match(/VS-[A-Z0-9-]+/gi)
    let skuA = 'VS-DR-01'
    let skuB = 'VS-DR-02'
    if (skuMatches && skuMatches.length >= 2) {
      skuA = skuMatches[0]
      skuB = skuMatches[1]
    } else if (skuMatches && skuMatches.length === 1) {
      skuA = skuMatches[0]
    }
    toolArgs = { skuA, skuB }
    introMessage = `Comparing details for ${skuA} and ${skuB}...`
    outroMessage = "Here is a side-by-side comparison of the fabrics, styles, and details."
  }
  // 5. checkInventory
  else if (query.includes('size') || query.includes('fit') || query.includes('stock') || query.includes('inventory')) {
    toolName = 'checkInventory'
    const skuMatch = userQuery.match(/VS-[A-Z0-9-]+/gi)
    const sku = skuMatch ? skuMatch[0] : 'VS-DR-01'
    toolArgs = { sku }
    introMessage = `Checking inventory for ${sku}...`
    outroMessage = "Real-time availability for this piece is shown above. Select a size to add it to your bag."
  }
  // 6. recommendByOccasion
  else if (query.includes('wedding') || query.includes('office') || query.includes('vacation') || query.includes('date night') || query.includes('party') || query.includes('casual')) {
    toolName = 'recommendByOccasion'
    let occasion: any = 'casual'
    if (query.includes('wedding')) occasion = 'wedding'
    else if (query.includes('office')) occasion = 'office'
    else if (query.includes('vacation')) occasion = 'vacation'
    else if (query.includes('date night')) occasion = 'date night'
    else if (query.includes('party')) occasion = 'party'
    
    toolArgs = { occasion, count: 6 }
    introMessage = `Searching our atelier catalog for ${occasion} wear...`
    outroMessage = `Here is our curated collection for your next ${occasion}.`
  }
  // 7. addToBag
  else if (query.includes('add') && (query.includes('bag') || query.includes('cart'))) {
    toolName = 'addToBag'
    const skuMatch = userQuery.match(/VS-[A-Z0-9-]+/gi)
    const sku = skuMatch ? skuMatch[0] : 'VS-DR-01'
    
    toolArgs = {
      productId: 'mock-id',
      sku,
      title: 'Silk Midi Dress',
      size: 'M',
      price: 4500,
      imageUrl: ''
    }
    introMessage = `Adding ${sku} to your shopping bag...`
    outroMessage = `I have added that item in size M to your bag.`
  }
  // 8. Personalized Recs
  else if (query.includes('recommend') || query.includes('personalized') || query.includes('for me')) {
    toolName = 'getPersonalizedRecommendations'
    toolArgs = { count: 4 }
    introMessage = "Generating personalized recommendations based on your style persona..."
    outroMessage = "These pieces are selected specifically for you. Let me know if you would like me to style them into a look."
  }
  // 9. findSimilarProducts (Visual Search)
  else if (query.includes('[image upload]') || query.includes('similar to this image') || query.includes('similar to the image') || query.includes('similar') || query.includes('product related to this')) {
    toolName = 'findSimilarProducts'
    // Strip the [Image Upload] prefix and use the rest as the description
    let cleanedDesc = userQuery.replace(/\[image upload\]/gi, '').trim()
    // If user only said "give me product related to this" with no real description,
    // use a broad fashion query to get real results from the DB
    if (!cleanedDesc || cleanedDesc.toLowerCase() === 'give me product related to this') {
      cleanedDesc = 'fashion clothing apparel style'
    }
    toolArgs = { imageDescription: cleanedDesc, count: 6 }
    introMessage = `Analyzing your uploaded image and searching our collection for similar pieces...`
    outroMessage = "We found these visual matches that align with the style, color, and silhouette of your image."
  }
  // 10. searchProducts (default)
  else {
    toolName = 'searchProducts'
    let category: string | undefined
    if (query.includes('dress')) category = 'dresses'
    else if (query.includes('top') || query.includes('shirt')) category = 'tops'
    else if (query.includes('pant') || query.includes('trouser') || query.includes('jeans')) category = 'pants'
    else if (query.includes('skirt')) category = 'skirts'
    else if (query.includes('outerwear') || query.includes('jacket') || query.includes('coat')) category = 'outerwear'
    else if (query.includes('accessory') || query.includes('bag') || query.includes('belt')) category = 'accessories'
    else if (query.includes('shoe') || query.includes('heels')) category = 'shoes'

    let priceMax: number | undefined
    const priceMaxMatch = query.match(/(?:under|below|max|under ₹|below ₹)\s*(\d+)/i)
    if (priceMaxMatch) priceMax = parseInt(priceMaxMatch[1], 10)

    toolArgs = { query: userQuery, category, priceMax, count: 6 }
    introMessage = `Searching our catalog for ${category || 'pieces'} matching "${userQuery}"...`
    outroMessage = "Above are the closest matches from our current inventory."
  }

  let toolResult: any = { type: 'error', message: 'Tool execution failed' }
  try {
    const tool = agentTools[toolName] as any
    if (tool && typeof tool.execute === 'function') {
      toolResult = await tool.execute(toolArgs)
    }
  } catch (err) {
    console.error(`[mock-agent] Failed to execute tool ${toolName}:`, err)
    toolResult = { type: 'error', message: String(err) }
  }

  const textEncoder = new TextEncoder()
  const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'x-vercel-ai-ui-message-stream': 'v1',
    'x-accel-buffering': 'no'
  }

  const callId = 'call-' + Math.random().toString(36).substring(7)

  // Persist the message to database on finish
  if (chatId) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const mockAssistantMessage = {
          id: 'msg-' + Math.random().toString(36).substring(7),
          role: 'assistant' as const,
          parts: [
            { type: 'text' as const, text: `[Demo Mode] ${introMessage}` },
            {
              type: `tool-${toolName}` as const,
              toolCallId: callId,
              state: 'done' as const,
              input: toolArgs,
              output: toolResult
            },
            { type: 'text' as const, text: '\n\n' + outroMessage }
          ],
          createdAt: new Date().toISOString()
        }

        const updatedMessages = [
          ...messages,
          mockAssistantMessage
        ]

        await supabase.from('chat_sessions').upsert({
          id: chatId,
          user_id: user.id,
          messages: updatedMessages as any,
          updated_at: new Date().toISOString(),
        })
      }
    } catch (dbErr) {
      console.error('[mock-agent] Failed to persist mock session:', dbErr)
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendJSON = (obj: any) => {
        controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      const txt1Id = 't-' + Math.random().toString(36).substring(7)
      const txt2Id = 't-' + Math.random().toString(36).substring(7)

      // Start stream
      sendJSON({ type: 'start' })

      // Send intro text
      sendJSON({ type: 'text-start', id: txt1Id })
      sendJSON({ type: 'text-delta', id: txt1Id, delta: `[Demo Mode] ${introMessage}` })
      sendJSON({ type: 'text-end', id: txt1Id })

      // Send tool call
      sendJSON({
        type: 'tool-input-available',
        toolCallId: callId,
        toolName,
        input: toolArgs
      })

      // Send tool result
      sendJSON({
        type: 'tool-output-available',
        toolCallId: callId,
        output: toolResult
      })

      // Send outro text
      sendJSON({ type: 'text-start', id: txt2Id })
      sendJSON({ type: 'text-delta', id: txt2Id, delta: '\n\n' + outroMessage })
      sendJSON({ type: 'text-end', id: txt2Id })

      // Finish stream
      sendJSON({ type: 'finish', finishReason: 'stop' })
      controller.enqueue(textEncoder.encode("data: [DONE]\n\n"))
      controller.close()
    }
  })

  return new Response(stream, { headers: sseHeaders })
}
