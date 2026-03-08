import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/'];

// Define role-based route access
const roleRoutes: Record<string, string[]> = {
  doctor: ['/dashboard', '/patients', '/consultations', '/prescriptions'],
  nurse: ['/dashboard', '/patients', '/tasks'],
  admin: ['/dashboard', '/admin', '/analytics', '/settings'],
  public_health: ['/dashboard', '/surveillance', '/analytics'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const authStorage = request.cookies.get('auth-storage');
  
  if (!authStorage) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Parse auth storage
    const authData = JSON.parse(authStorage.value);
    const { user, tokens } = authData.state || {};

    if (!user || !tokens?.accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const userRole = user.role;
    const allowedRoutes = roleRoutes[userRole] || [];

    // Check if user has access to the requested route
    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!hasAccess) {
      // Redirect to dashboard if no access
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If parsing fails, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
