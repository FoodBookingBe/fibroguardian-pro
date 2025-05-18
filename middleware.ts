// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  });

  // Expliciete initialisatie van Supabase met verbose logging
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name);
          const value = cookie?.value;
          console.log(`[Middleware] Getting cookie: ${name}, exists: ${!!value}, length: ${value?.length || 0}`);
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`[Middleware] Setting cookie: ${name}, length: ${value.length}, options:`, options);
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          console.log(`[Middleware] Removing cookie: ${name}`);
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // CRITICAL: Actief token refresh forceren voordat we verder gaan
  try {
    console.log("[Middleware] Attempting to refresh session...");
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession(); // Renamed 'session' to 'refreshData' to avoid conflict
    
    if (refreshError) {
      console.error("[Middleware] Session refresh error:", refreshError.message, refreshError);
      // Even if refresh fails, we might still have a valid (but soon to expire) session from cookies.
      // Proceed to getUser to see what Supabase makes of the current state.
    } else if (refreshData.session) { // Check refreshData.session
      console.log("[Middleware] Session refreshed successfully for user:", refreshData.session.user.id);
      // The refreshSession call itself should have updated the cookies via the 'set' handler.
      // Calling getUser() afterwards ensures the Supabase client instance state is also updated.
      // This also handles the case where refreshSession() might return a session but not trigger onAuthStateChange if the user object itself didn't change.
      console.log("[Middleware] Calling getUser() after successful refresh to sync client state.");
      await supabase.auth.getUser(); 
    } else {
      console.log("[Middleware] No session data returned from refreshSession, user likely not logged in or session invalid.");
      // If refreshSession returns no session and no error, it usually means there was nothing to refresh (e.g. no refresh token).
      // The subsequent getUser() will confirm this.
    }
  } catch (e) {
    console.error("[Middleware] Unexpected error during supabase.auth.refreshSession():", e);
  }

  // Pas nu doen we de gebruikerscontrole
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  console.log(`[Middleware] getUser after refresh attempt: user ID: ${user?.id}, error: ${getUserError?.message}`);


  // Bestaande redirect logica, etc.
  if (getUserError || !user) {
    const url = req.nextUrl.clone();
    // Define public paths that don't require authentication
    const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/api/auth/callback', '/offline'];
    
    // Allow API routes to proceed for now, they should handle their own auth.
    // This prevents redirect loops if an API route is called by a client that thinks it's auth'd but middleware disagrees.
    const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

    if (!isApiRoute && !publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
      console.log(`[Middleware] No user or getUserError on protected path "${req.nextUrl.pathname}". Redirecting to login.`);
      url.pathname = '/auth/login';
      url.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    // Log error if it's not a simple "no user" case and it's a protected path attempt
    if (getUserError && !isApiRoute && !publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
      console.error('[Middleware] Error fetching user for protected path:', getUserError.message);
    }
    // For public paths or API routes, or if there was an error but it's a public path, continue with current response.
    // Security headers will be added below.
  } else if (user) {
    // User is authenticated. Perform role checks for specific routes if needed.
    if (req.nextUrl.pathname.startsWith('/admin')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('type')
            .eq('id', user.id)
            .single();
        
        if (!profile || profile.type !== 'admin') {
            console.log(`[Middleware] Non-admin user ${user.id} (type: ${profile?.type}) attempting to access /admin. Redirecting.`);
            const url = req.nextUrl.clone();
            url.pathname = '/dashboard'; 
            url.searchParams.set('error', 'unauthorized_admin_access');
            return NextResponse.redirect(url);
        }
        console.log(`[Middleware] Admin user ${user.id} accessing /admin.`);
    }
    // Add other role-specific route protections if necessary
  }
  
  // Rest van je middleware logica (routes, headers, etc.)
  // CSP and other security headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.hsappstatic.net;
    img-src 'self' data: blob: https: *.supabase.co;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com ${process.env.NODE_ENV === 'development' ? 'http://localhost:* ws://localhost:*' : ''};
    frame-src https://js.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
  
  res.headers.set('Content-Security-Policy', cspHeader);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icons/|screenshots/).*)',
  ],
};
