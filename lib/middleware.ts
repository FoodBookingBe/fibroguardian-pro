import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Generate a nonce for each request
  // Note: For strict CSP, this nonce needs to be passed to script tags.
  // Next.js currently makes this complex for _next/static/chunks scripts.
  // A common approach is to use 'strict-dynamic' if your browser support allows,
  // or carefully manage hashes/nonces for critical scripts.
  // For simplicity here, we'll generate it but acknowledge the challenge.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
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
  
  // Clone request headers to set new ones
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce); // Pass nonce to be potentially used by server components
  
  // Set security headers on the response
  res.headers.set('Content-Security-Policy', cspHeader); // Ensure this line is active
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Or DENY if no framing needed
  res.headers.set('X-XSS-Protection', '1; mode=block'); // Older browsers, CSP is preferred
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()'); // Added payment for Stripe

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          // The response object needs to be updated with the new cookie.
          // NextResponse.next() creates a new response, so we pass it along.
          // Note: This approach with res.cookies.set might need adjustment
          // if multiple cookies are set or if headers are already sent.
          // For auth helpers, the library often handles setting the cookie on `res` internally
          // when `createMiddlewareClient` is used. With `createServerClient`, we might need to be more explicit.
          // However, the primary goal here is session *retrieval*. Cookie *setting* on response
          // is critical for `exchangeCodeForSession` or `refreshSession` if they happen in middleware,
          // but `getSession` is read-only.
          // Let's ensure the response object `res` is the one that ultimately gets the cookie set.
          // The `supabase/ssr` examples often show setting the cookie on the response directly.
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Fetch user instead of session for server-side validation
  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = [
    '/dashboard', '/taken', '/opdrachten', '/rapporten', 
    '/reflecties', '/specialisten', '/instellingen',
    '/mijn-specialisten', '/overzicht', '/inzichten', '/auth-test',
  ];
  const authPaths = ['/auth/login', '/auth/register'];

  const url = req.nextUrl.clone();
  const path = url.pathname;
  
  // If trying to access auth page while logged in, redirect to dashboard
  if (user && authPaths.some(authPath => path.startsWith(authPath))) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If trying to access protected path without a user, redirect to login
  if (!user && protectedPaths.some(protectedPath => path.startsWith(protectedPath))) {
    const redirectTo = path === '/' ? '/dashboard' : path; // If root is protected, redirect to dashboard after login
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', redirectTo);
    return NextResponse.redirect(url);
  }

  // Specialist-only path protection
  if (user && path.startsWith('/specialisten')) { // Check against user object
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id) // Use user.id
        .single();

      if (profileError || !profile || profile.type !== 'specialist') {
        url.pathname = '/dashboard'; // Or a specific 'unauthorized' page
        url.searchParams.delete('redirectTo'); // Clear redirectTo if any
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Middleware profile type check error:', error);
      url.pathname = '/dashboard'; 
      return NextResponse.redirect(url);
    }
  }
  
  // If it's an API route, we might not want to modify headers in the same way,
  // or we might want to apply different rate limiting.
  // For now, all responses get these headers.
  return res;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - /icons/ (PWA icons)
    // - /screenshots/ (PWA screenshots)
    // - /api/auth/callback (Supabase auth callback) - this should be handled by its route handler
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icons/|screenshots/|api/auth/callback).*)',
  ],
};
