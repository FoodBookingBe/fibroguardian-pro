import React from 'react';

'use client';
import SidebarContainer from '@/containers/layout/SidebarContainer';
import TopbarContainer from '@/containers/layout/TopbarContainer'; // Updated import
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, loadingAuth, loadingProfile } = useAuth(); // Use more specific loading states from AuthProvider
  // const router = useRouter(); // No longer needed for redirection here
  const [mounted, setMounted] = useState(false);

  // console.log('[Client DashboardLayout] State:', { user: !!user, loading, mounted });

  // Voorkomen van hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirection logic is now primarily handled by AuthProvider.
  // This component will show a loading spinner while AuthProvider determines auth state.
  // If AuthProvider determines no user/session for a protected route, it will redirect.

  // Use the combined loading state from AuthProvider, or specific ones if preferred
  const isLoadingAuthState = loadingAuth || (!!user && loadingProfile); // or simply `loading` from useAuth()

  if (!mounted || isLoadingAuthState) { // Check mounted and the auth loading state
    // console.log('[Client DashboardLayout] Rendering spinner due to mounting or auth loading');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
 
  // If still loading, AuthProvider hasn't finished. If not loading and no user,
  // AuthProvider should have redirected if this is a protected route.
  // So, if we reach here and there's no user, it implies this might be a brief moment before redirect,
  // or the route is public but mistakenly using DashboardLayout without auth.
  // For simplicity, we rely on AuthProvider's redirection. If !user, AuthProvider handles it.
  // If it's a route that *can* be accessed without a user but still uses DashboardLayout (unlikely for a "dashboard"),
  // then this check might need adjustment. For now, assume AuthProvider handles the !user case for protected routes.
  if (!user && mounted && !isLoadingAuthState) {
    // This case should ideally not be hit for protected routes as AuthProvider would redirect.
    // If it is, it might indicate a public page using DashboardLayout or a race condition.
    // console.log('[Client DashboardLayout] User is null after loading, AuthProvider should handle redirect.');
    return null; // Or a more graceful "unauthorized" message if this layout can be on public pages
  }
 
  // console.log('[Client DashboardLayout] Rendering main layout');
  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarContainer /> {/* Updated component */}
      
      <div className="flex-1 flex flex-col md:ml-64">
        <TopbarContainer /> {/* Updated component */}
        
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}