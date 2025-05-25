// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from './lib/monitoring/logger';
import { securityHeaders } from './lib/security-headers';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  });

  // Initialize Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Simply check user authentication without forcing refresh
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // Handle authentication and authorization
  if (getUserError || !user) {
    // User is not authenticated
    const url = req.nextUrl.clone();
    const publicPaths = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/api/auth/callback',
      '/offline',
      '/pricing'
    ];

    // Allow API routes to handle their own auth to prevent redirect loops
    const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

    if (!isApiRoute && !publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
      // Redirect unauthenticated users to login
      url.pathname = '/auth/login';
      url.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } else if (user) {
    // User is authenticated - check role-based access
    if (req.nextUrl.pathname.startsWith('/admin')) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logger.error("[Middleware] Error fetching profile for admin check", {
            userId: user.id,
            error: profileError
          });
        }

        if (!profile || profile.type !== 'admin') {
          // Unauthorized admin access attempt
          const url = req.nextUrl.clone();
          url.pathname = '/dashboard';
          url.searchParams.set('error', 'unauthorized_admin_access');
          return NextResponse.redirect(url);
        }
      } catch (error) {
        logger.error("[Middleware] Unexpected error during admin authorization", { error });
        // On error, redirect to dashboard as a safety measure
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  // Apply security headers from the centralized configuration
  securityHeaders.forEach(header => {
    res.headers.set(header.key, header.value);
  });

  return res;
}

export const _config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icons/|screenshots/).*)',
  ],
};
