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
            cookieStore.set({
              name,
              value,
              ...options,
              // Zorg dat cookies correct worden ingesteld
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true
            });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    try {
      console.log("Auth callback: exchanging code for session");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) throw error;
      
      console.log("Auth callback: session exchange successful, user:", !!data?.user);
      
      // Voeg een kleine debug component toe aan de redirect URL
      return NextResponse.redirect(new URL('/dashboard?auth=success', requestUrl.origin));
    } catch (error) {
      console.error('Error exchanging code for session:', error);
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
