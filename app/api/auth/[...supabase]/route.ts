// Imports for createServerClient, CookieOptions, cookies, NextResponse, NextRequest were here
// but are unused since the GET handler is commented out.
// If this route is to be used for other purposes, re-add necessary imports.

// Assuming env-config.ts will export an object with appUrl
// import { config } from '@/lib/env-config'; // We'll use process.env directly or requestUrl.origin

// The GET handler for code exchange is now primarily handled by app/api/auth/callback/route.ts
// If this [...supabase] route was intended for other specific GET operations under /api/auth/,
// those could be added here. Otherwise, this GET handler might be redundant.
// For now, commenting out the GET handler to rely on the dedicated callback route.
/*
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session in [...supabase] route:', error);
      const errorRedirectUrl = new URL('/auth/login', origin);
      errorRedirectUrl.searchParams.set('error', 'auth_exchange_error');
      errorRedirectUrl.searchParams.set('error_description', 'Failed to exchange auth code.');
      return NextResponse.redirect(errorRedirectUrl);
    }
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  
  return NextResponse.redirect(new URL(redirectTo, appUrl));
}
*/

// If you need other specific handlers (e.g., POST for signout, GET for user) for /api/auth/*,
// they can be defined here. For example:
// export async function POST(req: NextRequest) { /* ... */ }
