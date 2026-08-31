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
  '/documentacao/login',
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

// These pages are shared by all authenticated profiles. They must be checked
// independently from the role-specific route prefixes below; otherwise a
// valid user is redirected to their dashboard when opening Meu Perfil or
// Configurações.
const sharedAuthenticatedRoutes = ['/perfil', '/configuracoes'];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  SUPER_ADMIN_GLOBAL: ['/super-admin', '/admin', '/coordinator', '/professor', '/aluno', '/responsaveis', '/communication', '/documentacao'],
  SUPER_ADMIN: ['/super-admin', '/admin', '/coordinator', '/professor', '/aluno', '/responsaveis', '/communication', '/documentacao'],
  DIRECTOR: ['/admin', '/super-admin/questions', '/communication', '/documentacao'],
  INSTITUTION_ADMIN: ['/admin', '/coordinator', '/professor', '/aluno', '/responsaveis', '/communication', '/documentacao'],
  // A coordenação usa as telas de disciplinas e turmas compartilhadas com a
  // administração. As permissões de criação/edição continuam sendo validadas
  // pela API, mas o middleware precisa permitir a navegação até essas telas.
  COORDINATOR: ['/coordinator', '/admin/subjects', '/admin/classes', '/professor', '/aluno', '/communication', '/documentacao'],
  TEACHER: ['/professor', '/communication', '/documentacao'],
  STUDENT: ['/aluno', '/communication'],
  PARENT: ['/responsaveis', '/communication'],
};

export function middleware(request: NextRequest) {
  const incomingPathname = request.nextUrl.pathname;
  const configuredDocsHost = process.env.DOCS_HOST || process.env.NEXT_PUBLIC_DOCS_HOST;
  const requestHost = request.headers.get('host')?.split(':')[0];
  const isDocsHost = Boolean(configuredDocsHost && requestHost === configuredDocsHost);
  const pathname = isDocsHost
    ? incomingPathname === '/'
      ? '/documentacao'
      : incomingPathname.startsWith('/documentacao')
        ? incomingPathname
        : `/documentacao${incomingPathname}`
    : incomingPathname;

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
    if (isDocsHost) {
      loginUrl.pathname = '/documentacao/login';
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for protected routes
  if (accessToken && userRole && !isPublicRoute) {
    const canAccessSharedRoute = sharedAuthenticatedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/'),
    );

    if (canAccessSharedRoute) {
      return NextResponse.next();
    }

    const hasAccess = checkRoleAccess(pathname, userRole);
    if (!hasAccess) {
      // User doesn't have access to this route, redirect to their dashboard
      const redirectPath = getRedirectPathByRole(userRole);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  if (isDocsHost) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname;
    return NextResponse.rewrite(rewriteUrl);
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
