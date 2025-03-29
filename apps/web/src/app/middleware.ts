import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects admin routes
export function middleware(request: NextRequest) {
  // Check if the route is in the admin section
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // In a real implementation, we would check for an admin session cookie
    // or a JWT token with admin claims
    
    // For now, we'll redirect to a sign-in page as we'll implement the client-side auth check
    const hasAdminCookie = request.cookies.has('admin_session');
    
    // If no admin session, redirect to login
    if (!hasAdminCookie) {
      const signInUrl = new URL('/auth/login', request.url);
      // Add a redirect parameter so we can send them back to the admin page after login
      signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// Apply this middleware to admin routes
export const config = {
  matcher: '/admin/:path*',
};