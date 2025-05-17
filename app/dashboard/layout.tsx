import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; // Updated import
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { handleServerError } from '@/utils/error-handling'; // Import handleServerError
// Sidebar and Topbar are part of the client-side DashboardLayout, not needed here.
// import Sidebar from '@/components/layout/Sidebar'; 
// import Topbar from '@/components/layout/Topbar';   

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = getSupabaseServerComponentClient(); // Use the new standardized client
  
  // Server-side auth verificatie
  const { data: { user }, error } = await supabase.auth.getUser(); // Use getUser()
  
  if (error) {
    // Use handleServerError for consistent error handling
    return handleServerError(error, '/auth/login'); 
  }

  if (!user) {
    // Als geen gebruiker, redirect hard naar login
    console.log("No user session found in dashboard layout, redirecting to login.");
    // redirect will throw an error, so no need to return its result
    redirect('/auth/login'); 
  }

  // If we are here, user is authenticated.
  // The visual structure (Sidebar, Topbar, main content area)
  // is expected to be handled by the 'components/layout/DashboardLayout.tsx'
  // which is used by the individual page components passed as {children}.
  // So, this server layout primarily handles the auth check.
  return <>{children}</>;
}
