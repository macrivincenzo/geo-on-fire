import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Define protected routes
const protectedRoutes = ['/dashboard', '/chat', '/brand-monitor'];

// Cookie settings for affiliate tracking
const AFFILIATE_COOKIE_NAME = 'geo_affiliate';
const AFFILIATE_COOKIE_EXPIRY_DAYS = 30;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const url = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for session cookie
    const sessionCookie = await getSessionCookie(request);
    
    if (!sessionCookie) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  
  // Handle affiliate tracking via cookies (Edge-compatible, no DB calls)
  const affiliate = url.searchParams.get('affiliate');
  if (affiliate) {
    const cookieValue = JSON.stringify({
      affiliate,
      source: url.searchParams.get('source') || 'custom',
      campaign: url.searchParams.get('campaign') || null,
      timestamp: new Date().toISOString(),
    });
    
    // Set affiliate cookie
    response.cookies.set(AFFILIATE_COOKIE_NAME, cookieValue, {
      path: '/',
      maxAge: AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).)',
  ],
};
