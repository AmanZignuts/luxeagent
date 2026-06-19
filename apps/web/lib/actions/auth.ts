'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const selectedRole = formData.get('role') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const actualRole = data.user?.user_metadata?.role ?? 'shopper'

  if (selectedRole && actualRole !== selectedRole) {
    await supabase.auth.signOut()
    return { error: `Invalid login credentials.` }
  }

  revalidatePath('/', 'layout')
  redirect(actualRole === 'merchant' ? '/seller/dashboard' : '/shop')
}


// ─────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = (formData.get('role') as string) ?? 'shopper'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create empty style profile for all new users (shoppers and merchants)
  if (data.user) {
    await supabase.from('user_style_profiles').upsert({
      user_id: data.user.id,
      display_name: fullName,
      onboarding_complete: role === 'merchant',
    })
  }

  revalidatePath('/', 'layout')
  redirect(role === 'merchant' ? '/onboarding/merchant' : '/onboarding/style-persona')
}

// ─────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────
export async function logoutAction(redirectTo: string = '/login') {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

// ─────────────────────────────────────────────────────────────────────
// COMPLETE ONBOARDING
// ─────────────────────────────────────────────────────────────────────
export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const displayName = formData.get('displayName') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const styleTokens = formData.getAll('styleTokens') as string[]
  const preferredSize = formData.get('preferredSize') as string
  const budgetMin = Number(formData.get('budgetMin') ?? 0)
  const budgetMax = Number(formData.get('budgetMax') ?? 10000)
  const preferredColors = formData.getAll('preferredColors') as string[]
  const preferredCategories = formData.getAll('preferredCategories') as string[]

  if (phone || address) {
    await supabase.auth.updateUser({
      data: {
        phone: phone || undefined,
        address: address || undefined,
      }
    })
  }

  const { error } = await supabase.from('user_style_profiles').upsert({
    user_id: user.id,
    display_name: displayName,
    style_tokens: styleTokens,
    preferred_size: preferredSize,
    budget_min: budgetMin,
    budget_max: budgetMax,
    preferred_colors: preferredColors,
    preferred_categories: preferredCategories,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/shop')
}
