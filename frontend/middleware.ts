import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { serverCookies } from './src/lib/cookies';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/login/super-admin',
  '/login/admin',
  '/login/professor',
  '/login/aluno',
  '/login/responsaveis',
  '/forgot-password',
  '/reset-password',
  '/select-profile', // Allow profile selection after login
  '/institutions', // Public institution selection page for municipality deployments
  '/register', // Public registration page
];

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = [
  '/login',
  '/login/super-admin',
  '/login/admin',
  '/login/professor',
  '/login/aluno',
  '/login/responsaveis',
  '/forgot-password'
];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  SUPER_ADMIN: ['/super-admin', '/admin', '/coordinator', '/professor', '/aluno', '/responsaveis'],
  INSTITUTION_ADMIN: ['/admin', '/coordinator', '/professor', '/aluno', '/responsaveis'],
  COORDINATOR: ['/coordinator', '/professor', '/aluno'],
  TEACHER: ['/professor'],
  STUDENT: ['/aluno'],
  PARENT: ['/responsaveis'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get tokens from cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const { accessToken } = serverCookies.getAuthTokens(cookieHeader);
  const roleFromCookie = serverCookies.getUserRole(cookieHeader);

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  const userRole = roleFromCookie;

  // If user is authenticated and trying to access auth pages, redirect based on role
  if (accessToken && userRole && isAuthRoute) {
    const redirectPath = getRedirectPathByRole(userRole);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // If user is not authenticated and trying to access protected route
  if (!accessToken && !isPublicRoute) {
    // Store the attempted URL to redirect back after login
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for protected routes
  if (accessToken && userRole && !isPublicRoute) {
    const hasAccess = checkRoleAccess(pathname, userRole);
    if (!hasAccess) {
      // User doesn't have access to this route, redirect to their dashboard
      const redirectPath = getRedirectPathByRole(userRole);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

function getRedirectPathByRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'INSTITUTION_ADMIN':
      return '/admin/dashboard';
    case 'COORDINATOR':
      return '/coordinator/dashboard';
    case 'TEACHER':
      return '/professor/dashboard';
    case 'STUDENT':
      return '/aluno/dashboard';
    case 'PARENT':
      return '/responsaveis/dashboard';
    default:
      return '/dashboard';
  }
}

function checkRoleAccess(pathname: string, role: string): boolean {
  const allowedRoutes = roleRoutes[role] || [];

  // Check if any allowed route matches the pathname
  return allowedRoutes.some(route => pathname.startsWith(route));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
};
