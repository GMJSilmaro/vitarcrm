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
    pathname === '/sign-in' ||
    pathname === '/' ||
    pathname === '/authentication/sign-in' ||
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

  const customToken = request.cookies.get('customToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const workerId = request.cookies.get('workerId')?.value;

  // Check authentication
  if (!customToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Handle worker profile access
  if (pathname.startsWith('/user/')) {
    const targetWorkerId = pathname.split('/')[2];
    const hasAccess = 
      targetWorkerId === workerId || 
      ['admin', 'supervisor', 'worker'].includes(userRole);

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};