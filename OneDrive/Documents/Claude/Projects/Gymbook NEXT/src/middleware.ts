import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/api/health', '/api/auth']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const session = req.auth

  // Not logged in → redirect to login
  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Logged in + visiting auth pages → redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/register')) {
    const role = session.user?.role
    const dest = role === 'TRAINER' ? '/trainer' : '/client'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Role-based: client can't access /trainer routes and vice versa
  if (session) {
    const role = session.user?.role
    if (pathname.startsWith('/trainer') && role !== 'TRAINER') {
      return NextResponse.redirect(new URL('/client', req.url))
    }
    if (pathname.startsWith('/client') && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/trainer', req.url))
    }
    // Onboarding guard: new clients must complete onboarding first
    if (pathname.startsWith('/client') && pathname !== '/client/onboarding' && role === 'CLIENT') {
      // Will be enhanced in Fase 2 to check onboardingCompleted flag
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
