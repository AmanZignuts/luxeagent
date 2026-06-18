import './polyfill'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Supabase SSR: refresh session token on every request ──────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // A simple mistake here could cause hard-to-debug session issues.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Route classification ──────────────────────────────────────────
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/pdp')

  const isGuestOnlyRoute =
    pathname === '/login' ||
    pathname === '/register'

  const isShopperRoute =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/concierge') ||
    (pathname.startsWith('/onboarding') && !pathname.startsWith('/onboarding/merchant'))

  const isSellerLoginRoute =
    pathname === '/seller/login' || pathname === '/seller/register'

  const isSellerRoute =
    (pathname.startsWith('/seller') && pathname !== '/seller/login' && pathname !== '/seller/register') ||
    pathname.startsWith('/onboarding/merchant')

  // ── 0. Always allow public routes & seller login page ─────────────
  if (isPublicRoute || isSellerLoginRoute) {
    // If already logged in as merchant, bounce to dashboard
    if (user && user.user_metadata?.role === 'merchant') {
      const url = request.nextUrl.clone()
      url.pathname = '/seller/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── 1. No session → redirect to login ────────────────────────────
  if (!user && (isShopperRoute || isSellerRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── 2. Has session + guest route → redirect to app ───────────────
  if (user && isGuestOnlyRoute) {
    const url = request.nextUrl.clone()
    // Check role from user_metadata (set on signup)
    const isMerchant = user.user_metadata?.role === 'merchant'
    url.pathname = isMerchant ? '/seller/dashboard' : '/shop'
    return NextResponse.redirect(url)
  }

  // ── 3. Shoppers cannot access seller routes ───────────────────────
  if (user && isSellerRoute) {
    const isRegisteringMerchant = user.user_metadata?.role === 'merchant' && pathname.startsWith('/onboarding/merchant')
    if (!isRegisteringMerchant) {
      const { data: profile } = await supabase
        .from('merchant_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        const url = request.nextUrl.clone()
        url.pathname = '/shop'
        return NextResponse.redirect(url)
      }
    }
  }

  // ── 4. Merchants cannot access shopper routes ─────────────────────
  if (user && isShopperRoute) {
    const { data: profile } = await supabase
      .from('merchant_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profile) {
      const url = request.nextUrl.clone()
      url.pathname = '/seller/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
