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
    pathname === '/sign-in' ||
    pathname === '/' ||
    pathname === '/authentication/sign-in' ||
    pathname.startsWith('/api/auth/') // Allow authentication API routes
  );
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static and public paths
  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For API routes that aren't auth routes, check for authentication
  if (pathname.startsWith('/api/')) {
    const hasAuthCookie = request.cookies.get('customToken')?.value;
    if (!hasAuthCookie) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    return NextResponse.next();
  }

  // Check essential cookies for non-API routes
  const essentialCookies = [
    'customToken',
    'uid',
    'workerId',
    'B1SESSION',
    'B1SESSION_EXPIRY',
    'ROUTEID'
  ];

  const missingCookies = essentialCookies.filter(
    cookieName => !request.cookies.get(cookieName)?.value
  );

  if (missingCookies.length > 0) {
    console.log('Missing essential cookies:', missingCookies);
    const response = NextResponse.redirect(new URL('/sign-in', request.url));
    request.cookies.getAll().forEach(cookie => {
      response.cookies.delete(cookie.name);
    });
    return response;
  }

  // Check session expiry
  const expiryTime = request.cookies.get('B1SESSION_EXPIRY')?.value;
  if (expiryTime && Date.now() >= new Date(expiryTime).getTime()) {
    console.log('Session expired, redirecting to login');
    const response = NextResponse.redirect(new URL('/sign-in', request.url));
    request.cookies.getAll().forEach(cookie => {
      response.cookies.delete(cookie.name);
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};