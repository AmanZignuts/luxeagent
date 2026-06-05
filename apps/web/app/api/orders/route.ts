import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { OrderItem, ShippingAddress } from '@/lib/supabase/types'

/**
 * POST /api/orders
 * Mock checkout: creates a CONFIRMED order in the database.
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { items: OrderItem[]; shippingAddress: ShippingAddress }
  const { items, shippingAddress } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 })
  }

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.qty, 0)
  const shippingCost = subtotal >= 500 ? 0 : 25
  const total = subtotal + shippingCost
  const trackingNumber = `LX${Date.now().toString(36).toUpperCase()}`

  const insertPayload = {
    user_id: user.id,
    items: items as unknown as import('@/lib/supabase/types').Json,
    subtotal,
    shipping_cost: shippingCost,
    total,
    status: 'CONFIRMED' as const,
    shipping_address: shippingAddress as unknown as import('@/lib/supabase/types').Json,
    tracking_number: trackingNumber,
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert(insertPayload)
    .select('id, tracking_number, total, status')
    .single()

  if (error) {
    console.error('[orders/route] Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    orderId: order?.id,
    trackingNumber: order?.tracking_number,
    total: order?.total,
    status: order?.status,
  })
}

/**
 * GET /api/orders
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: orders ?? [] })
}
