import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar'; // Assuming Sidebar and Topbar are still needed here for structure
import Topbar from '@/components/layout/Topbar';   // or if DashboardLayout handles them, these might not be needed directly

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
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
  
  // Server-side auth verificatie
  const { data, error } = await supabase.auth.getSession();
  const user = data?.session?.user;
  
  if (error) {
    console.error("Error getting session in dashboard layout:", error.message);
    // Optionally redirect to an error page or login
    redirect('/auth/login?error=session_error');
  }

  if (!user) {
    // Als geen gebruiker, redirect hard naar login
    console.log("No user session found in dashboard layout, redirecting to login.");
    redirect('/auth/login');
  }

  // If we are here, user is authenticated.
  // The visual structure (Sidebar, Topbar, main content area)
  // is expected to be handled by the 'components/layout/DashboardLayout.tsx'
  // which is used by the individual page components passed as {children}.
  // So, this server layout primarily handles the auth check.
  return <>{children}</>;
}