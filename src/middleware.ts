import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = ['/', '/catalog', '/login', '/api/auth'];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  SUPER_ADMIN: ['/dashboard', '/dashboard/users', '/dashboard/finance', '/dashboard/transactions', '/dashboard/overview', '/dashboard/game', '/dashboard/character', '/dashboard/weapon', '/dashboard/server', '/dashboard/payment-methods', '/dashboard/topup-packages', '/dashboard/topup-requests', '/dashboard/tiers', '/dashboard/profile', '/dashboard/platform-earnings', '/dashboard/pending-balances', '/dashboard/withdrawal-requests', '/dashboard/platform-settings', '/dashboard/activity-logs'],
  SUPPLIER: ['/dashboard', '/dashboard/inventory', '/dashboard/transactions', '/dashboard/overview', '/dashboard/extract', '/dashboard/topup', '/dashboard/profile', '/dashboard/sales', '/dashboard/pending-earnings', '/dashboard/withdrawal', '/dashboard/my-activity'],
  RESELLER: ['/dashboard', '/dashboard/extract', '/dashboard/transactions', '/dashboard/overview', '/dashboard/topup', '/dashboard/profile', '/dashboard/withdrawal', '/dashboard/my-activity'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/') || pathname.startsWith('/api/auth'))) {
    return NextResponse.next();
  }

  // Allow static files and public assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check authentication for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as string;
    const allowedRoutes = roleRoutes[userRole] || [];

    // Check if user has access to this route
    const hasAccess = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (!hasAccess && pathname !== '/dashboard') {
      // Redirect to their dashboard overview if they don't have access
      return NextResponse.redirect(new URL('/dashboard/overview', request.url));
    }

    return NextResponse.next();
  }

  // Protect API routes (except auth routes)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.id as string);
    response.headers.set('x-user-role', token.role as string);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
