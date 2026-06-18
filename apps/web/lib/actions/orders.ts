'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMerchantOrders() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify that the user has a merchant profile in the database
  const { data: merchantProfile } = await userClient
    .from('merchant_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!merchantProfile) {
    throw new Error('Unauthorized: Not a merchant')
  }

  // 2. Fetch all orders using admin client to bypass RLS SELECT restriction
  const adminClient = await createAdminClient()
  const { data: allOrders, error: ordersError } = await adminClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
    throw new Error('Failed to load orders')
  }

  // 3. Collect all product IDs from the orders
  const productIds = new Set<string>()
  for (const o of allOrders || []) {
    let items: any = []
    try {
      items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    } catch {
      items = (o.items as any) || []
    }
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.product_id) productIds.add(item.product_id)
      }
    }
  }

  // 4. Fetch the seller_id for each of those product IDs
  const { data: dbProducts } = await adminClient
    .from('products')
    .select('id, seller_id')
    .in('id', Array.from(productIds))

  const productSellerMap = new Map<string, string | null>()
  if (dbProducts) {
    for (const p of dbProducts) {
      productSellerMap.set(p.id, p.seller_id)
    }
  }

  // 5. Filter orders: Show if it contains at least one item that:
  // - Belongs to this merchant
  // - OR is a seeded product (seller_id is NULL)
  const filteredOrders = (allOrders || []).filter((o: any) => {
    let items: any[] = []
    try {
      items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    } catch {
      items = o.items || []
    }
    if (!Array.isArray(items)) return false
    return items.some(item => {
      const sellerId = productSellerMap.get(item.product_id)
      return sellerId === user.id || sellerId === null || sellerId === undefined
    })
  })

  return filteredOrders
}

export async function updateMerchantOrderStatus(orderId: string, nextStatus: string) {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify that the user has a merchant profile in the database
  const { data: merchantProfile } = await userClient
    .from('merchant_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!merchantProfile) {
    throw new Error('Unauthorized: Not a merchant')
  }

  // 2. Fetch the order items using admin client
  const adminClient = await createAdminClient()
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('items')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('Order not found')
  }

  let items: any = []
  try {
    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
  } catch {
    items = (order.items as any) || []
  }

  // 3. Verify access: must own at least one item OR it's a seeded product (seller_id is null)
  const orderProductIds = items.map((item: any) => item.product_id).filter(Boolean)
  const { data: dbProducts } = await adminClient
    .from('products')
    .select('id, seller_id')
    .in('id', orderProductIds)

  const productSellerMap = new Map<string, string | null>()
  if (dbProducts) {
    for (const p of dbProducts) {
      productSellerMap.set(p.id, p.seller_id)
    }
  }

  const ownsProductOrSeeded = items.some((item: any) => {
    const sellerId = productSellerMap.get(item.product_id)
    return sellerId === user.id || sellerId === null || sellerId === undefined
  })

  if (!ownsProductOrSeeded) {
    throw new Error('Access denied. This order does not contain your products.')
  }

  // 4. Update the status
  const { error: updateError } = await adminClient
    .from('orders')
    .update({ status: nextStatus as any })
    .eq('id', orderId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/seller/orders')
  return { success: true }
}
