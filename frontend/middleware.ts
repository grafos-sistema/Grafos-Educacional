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
  '/security',
  '/forgot-password',
  '/reset-password',
  '/select-profile', // Allow profile selection after login
  '/institutions', // Public institution selection page for municipality deployments
  '/register', // Public registration page
  '/pending-approval',
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
  SUPER_ADMIN_GLOBAL: ['/super-admin', '/admin', '/coordinator', '/professor', '/aluno', '/responsaveis', '/communication'],
  SUPER_ADMIN: ['/super-admin', '/admin', '/coordinator', '/professor', '/aluno', '/responsaveis', '/communication'],
  DIRECTOR: ['/admin', '/super-admin/questions', '/communication'],
  INSTITUTION_ADMIN: ['/admin', '/coordinator', '/professor', '/aluno', '/responsaveis', '/communication'],
  // A coordenação usa as telas de disciplinas e turmas compartilhadas com a
  // administração. As permissões de criação/edição continuam sendo validadas
  // pela API, mas o middleware precisa permitir a navegação até essas telas.
  COORDINATOR: ['/coordinator', '/admin/subjects', '/admin/classes', '/professor', '/aluno', '/communication'],
  TEACHER: ['/professor', '/communication'],
  STUDENT: ['/aluno', '/communication'],
  PARENT: ['/responsaveis', '/communication'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // #region debug-point infinite-loading-local-middleware
  const dbgUrl =
    process.env.NEXT_PUBLIC_DEBUG_SERVER_URL ||
    process.env.DEBUG_SERVER_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:7777/event' : '');
  const dbgSession =
    process.env.NEXT_PUBLIC_DEBUG_SESSION_ID ||
    process.env.DEBUG_SESSION_ID ||
    'infinite-loading-local';
  const dbgEmit = (name: string, payload?: Record<string, unknown>) => {
    if (!dbgUrl) return;
    fetch(dbgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ts: Date.now(),
        sessionId: dbgSession,
        source: 'frontend',
        scope: 'middleware',
        name,
        payload: payload ?? {},
      }),
    }).catch(() => {});
  };
  // #endregion debug-point infinite-loading-local-middleware

  if (
    pathname === '/sw.js' ||
    pathname.startsWith('/workbox-') ||
    pathname === '/site.webmanifest' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const { accessToken } = serverCookies.getAuthTokens(cookieHeader);
  const roleFromCookie = serverCookies.getUserRole(cookieHeader);

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  const userRole = roleFromCookie;

  dbgEmit('request', {
    pathname,
    hasAccessToken: Boolean(accessToken),
    hasRole: Boolean(userRole),
    role: userRole ?? null,
    isPublicRoute,
    isAuthRoute,
  });

  // If user is authenticated and trying to access auth pages, redirect based on role
  if (accessToken && userRole && isAuthRoute) {
    const redirectPath = getRedirectPathByRole(userRole);
    dbgEmit('redirect:authedOnAuthRoute', { pathname, redirectPath, role: userRole });
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // If user is not authenticated and trying to access protected route
  if (!accessToken && !isPublicRoute) {
    // Store the attempted URL to redirect back after login
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('from', pathname);
    dbgEmit('redirect:unauthedToLogin', { pathname, to: '/' });
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for protected routes
  if (accessToken && userRole && !isPublicRoute) {
    const hasAccess = checkRoleAccess(pathname, userRole);
    if (!hasAccess) {
      // User doesn't have access to this route, redirect to their dashboard
      const redirectPath = getRedirectPathByRole(userRole);
      dbgEmit('redirect:roleDenied', { pathname, redirectPath, role: userRole });
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

function getRedirectPathByRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN_GLOBAL':
      return '/admin/dashboard';
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'INSTITUTION_ADMIN':
      return '/admin/dashboard';
    case 'DIRECTOR':
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
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*\\.js|site\\.webmanifest|manifest\\.json|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
  ],
};
