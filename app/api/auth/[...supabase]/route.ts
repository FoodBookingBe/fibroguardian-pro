import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Assuming env-config.ts will export an object with appUrl
// import { config } from '@/lib/env-config'; // We'll use process.env directly or requestUrl.origin

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
      // Optionally redirect to an error page or login with an error message
      const errorRedirectUrl = new URL('/auth/login', origin);
      errorRedirectUrl.searchParams.set('error', 'auth_exchange_error');
      errorRedirectUrl.searchParams.set('error_description', 'Failed to exchange auth code.');
      return NextResponse.redirect(errorRedirectUrl);
    }
  }
  
  // Determine the base URL for redirection
  // Prefer NEXT_PUBLIC_APP_URL if available, otherwise use the request's origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  
  return NextResponse.redirect(new URL(redirectTo, appUrl));
}