import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ⚠️ Toggle this to enable/disable maintenance mode
const MAINTENANCE_MODE = false

// Block scrapers/crawlers but allow legit search engines
const BLOCKED_BOT_PATTERNS = /scraper|crawler|spider|curl|wget|python-requests|Go-http-client|httpclient|java\/|libwww|lwp-trivial|sitesucker|grab|fetch|node-fetch/i
const ALLOWED_BOTS = /googlebot|bingbot|yandexbot|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  if (host.includes('chameleon-nu.tech')) {
    const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://chameleon-nu.vercel.app')
    return NextResponse.redirect(targetUrl, 308)
  }

  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''

  // Block malicious bots (but allow search engines)
  if (BLOCKED_BOT_PATTERNS.test(userAgent) && !ALLOWED_BOTS.test(userAgent)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // If maintenance mode is enabled
  if (MAINTENANCE_MODE) {
    // Allow access to maintenance page itself and essential assets
    const allowedPaths = [
      '/maintenance',
      '/api',
      '/_next',
      '/favicon.ico',
    ]

    // Check if the path is allowed
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path))

    // If not allowed, redirect to maintenance page
    if (!isAllowed) {
      const maintenanceUrl = new URL('/maintenance', request.url)
      return NextResponse.redirect(maintenanceUrl)
    }
  }

  // Refresh user session only on document requests (HTML pages) that have auth cookies
  // to avoid hitting Supabase Auth rate limits (429) on parallel data/fetch requests
  let response = NextResponse.next({
    request,
  })

  const acceptHeader = request.headers.get('accept') || ''
  const isHtmlPage = acceptHeader.includes('text/html')
  const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.includes('auth-token'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isHtmlPage && hasAuthCookie && supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      })
      await supabase.auth.getUser()
    } catch (e) {
      console.error('Middleware Supabase session update error:', e)
    }
  }

  return response
}

// Only run middleware on page routes – skip static assets, API routes, and public files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|mp3|mp4|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}


