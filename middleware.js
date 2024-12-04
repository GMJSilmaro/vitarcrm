import { NextResponse } from 'next/server';

// Helper function to check if a path is static
function isStaticPath(pathname) {
  return (
    pathname.startsWith('/_next') ||
    pathname.includes('/static/') ||
    pathname.includes('/images/') ||
    pathname.includes('/fonts/') ||
    pathname.includes('/assets/') ||
    pathname.includes('/media/') ||
    pathname.includes('/api/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

// Helper function to check if path is public
function isPublicPath(pathname) {
  return (
    pathname === '/authentication/sign-in' ||
    pathname === '/' ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/logs/')
  );
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Skip static and public paths
  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get all required cookies
  const session = request.cookies.get('session')?.value;
  const customToken = request.cookies.get('customToken')?.value;
  const uid = request.cookies.get('uid')?.value;

  // Check if trying to access protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/protected')) {
    // If any required cookie is missing
    if (!session || !customToken || !uid) {
      console.log('Missing auth cookies:', { session, customToken, uid });
      
      // For API routes, return 401
      if (pathname.startsWith('/api/protected')) {
        return new NextResponse(
          JSON.stringify({ message: 'Authentication required' }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // For dashboard routes, redirect to login
      return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
    '/((?!_next/static|_next/image|favicon.ico|api/auth/login|authentication/sign-in).*)'
  ]
};