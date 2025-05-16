import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'; // Updated import

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res }); // Use createMiddlewareClient
  const { data: { session } } = await supabase.auth.getSession();

  // If no session, redirect to login except for public paths
  if (!session) {
    const url = req.nextUrl.clone();
    const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/api/auth/callback']; // Added /api/auth/callback
    if (!publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
      url.pathname = '/auth/login';
      url.searchParams.set('from', req.nextUrl.pathname); // Keep track of original path
      return NextResponse.redirect(url);
    }
    return res; // Allow access to public paths
  }

  // At this point, user has a session.
  // Perform role checks for specific routes.
  const user = session.user; // User is guaranteed to exist if session exists

  if (req.nextUrl.pathname.startsWith('/specialisten') && !req.nextUrl.pathname.startsWith('/specialisten/patienten')) { // Protect /specialisten root but not /specialisten/patienten for specialists
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.type !== 'specialist') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard'; // Redirect to dashboard or an unauthorized page
      url.searchParams.set('error', 'unauthorized_specialist_access');
      return NextResponse.redirect(url);
    }
  }

  if (req.nextUrl.pathname.startsWith('/mijn-specialisten')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.type !== 'patient') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard'; // Redirect to dashboard or an unauthorized page
      url.searchParams.set('error', 'unauthorized_patient_access');
      return NextResponse.redirect(url);
    }
  }
  
  // CSP and other security headers (can be kept or adjusted)
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
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - manifest.json, robots.txt, sitemap.xml (public static files)
    // - /icons/ (PWA icons)
    // - /screenshots/ (PWA screenshots)
    // - /api/auth/callback is handled by its route handler, but we might want to exclude it from general middleware logic if it causes issues.
    //   However, the publicPaths check above should handle it.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icons/|screenshots/).*)',
  ],
};
