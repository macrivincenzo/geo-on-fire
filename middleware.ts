import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { parseAffiliateParams, setAffiliateCookie, trackAffiliateVisit } from '@/lib/affiliate-tracker';

// Define protected routes
const protectedRoutes = ['/dashboard', '/chat', '/brand-monitor'];

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
  
  // Handle affiliate tracking
  const affiliateParams = parseAffiliateParams(url.searchParams);
  if (affiliateParams) {
    // Set affiliate cookie
    const cookieHeader = setAffiliateCookie(affiliateParams);
    response.headers.append('Set-Cookie', cookieHeader);

    // Track affiliate visit (async, don't wait)
    trackAffiliateVisit(affiliateParams, {
      url: url.toString(),
      referrer: request.headers.get('referer') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((error) => {
      console.error('Failed to track affiliate visit:', error);
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
