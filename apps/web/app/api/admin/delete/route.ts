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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
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
