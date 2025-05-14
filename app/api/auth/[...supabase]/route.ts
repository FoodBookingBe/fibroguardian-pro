import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Assuming env-config.ts will export an object with appUrl
import { config } from '@/lib/env-config'; 

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // Redirect na login
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  
  if (!config || !config.appUrl) {
    // Fallback or error handling if appUrl is not defined
    console.error("App URL is not configured. Redirecting to relative path.");
    return NextResponse.redirect(new URL(redirectTo, req.url)); // Fallback to relative redirect
  }
  
  return NextResponse.redirect(new URL(redirectTo, config.appUrl));
}