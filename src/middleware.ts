import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect routes with authentication
 *
 * Protects:
 * - /admin/* routes - Requires facilitator authentication
 * - /study/* routes - Requires panelist authentication
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protect facilitator routes (/admin/*)
  if (path.startsWith('/admin')) {
    // Allow access to login page
    if (path === '/admin/login') {
      // If already authenticated, redirect to admin dashboard
      const facilitatorSession = request.cookies.get('facilitator_session')
      if (facilitatorSession) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.next()
    }

    // Check for facilitator session
    const facilitatorSession = request.cookies.get('facilitator_session')

    if (!facilitatorSession) {
      // No session, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    // Validate session expiry
    try {
      const sessionData = JSON.parse(
        Buffer.from(facilitatorSession.value, 'base64').toString()
      )

      if (sessionData.exp < Date.now()) {
        // Session expired, redirect to login
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('facilitator_session')
        return response
      }
    } catch (error) {
      // Invalid session, redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('facilitator_session')
      return response
    }
  }

  // Protect panelist routes (/study/*)
  if (path.startsWith('/study/')) {
    // Check for panelist session
    const panelistSession = request.cookies.get('delphi_session')

    if (!panelistSession) {
      // No session, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Validate session expiry
    try {
      const sessionData = JSON.parse(
        Buffer.from(panelistSession.value, 'base64').toString()
      )

      if (sessionData.exp < Date.now()) {
        // Session expired, redirect to login
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('delphi_session')
        return response
      }
    } catch (error) {
      // Invalid session, redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('delphi_session')
      return response
    }
  }

  return NextResponse.next()
}

// Configure which paths to run middleware on
export const config = {
  matcher: [
    // Match admin routes (except login)
    '/admin/:path*',
    // Match study routes (panelist interface)
    '/study/:path*',
  ],
}
