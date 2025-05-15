import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure the route is always dynamic
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

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
      // URL to redirect to after successful sign in
      // This should typically be your dashboard or a welcome page.
      // Ensure this matches one of your allowed Redirect URLs in Supabase project settings.
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // URL to redirect to in case of error
      // You might want to redirect to an error page or the login page with an error message
      const errorUrl = new URL('/auth/login', requestUrl.origin);
      errorUrl.searchParams.set('error', 'auth_callback_error');
      errorUrl.searchParams.set('error_description', 'Could not exchange code for session. Please try again.');
      return NextResponse.redirect(errorUrl);
    }
  }

  // URL to redirect to if the code is missing
  console.warn('Auth callback called without a code.');
  const missingCodeUrl = new URL('/auth/login', requestUrl.origin);
  missingCodeUrl.searchParams.set('error', 'auth_callback_error');
  missingCodeUrl.searchParams.set('error_description', 'Authorization code missing. Please try again.');
  return NextResponse.redirect(missingCodeUrl);
}
