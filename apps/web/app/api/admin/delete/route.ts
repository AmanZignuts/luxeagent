import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const userClient = await createClient()

    // Verify the requester is authenticated
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify that the user has a merchant profile in the database
    const { data: merchantProfile } = await userClient
      .from('merchant_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!merchantProfile) {
      return NextResponse.json({ error: 'Unauthorized: Not a merchant' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify product ownership (seller_id must match user.id)
    const { data: product } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .maybeSingle()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.seller_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this product' }, { status: 403 })
    }
    
    // Attempt deletion with admin client to bypass RLS restrictions
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[delete] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error during deletion' },
      { status: 500 }
    )
  }
}
