'use client';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  console.log('[Client DashboardLayout] State:', { user: !!user, loading, mounted });

  // Voorkomen van hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect naar login als niet ingelogd
  useEffect(() => {
    console.log('[Client DashboardLayout] Auth state check effect:', { loading, user: !!user, mounted });
    if (!loading && !user && mounted) {
      console.log('[Client DashboardLayout] Redirecting to /auth/login');
      router.push('/auth/login');
    }
  }, [user, loading, router, mounted]);

  if (!mounted || loading) {
    console.log('[Client DashboardLayout] Rendering spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[Client DashboardLayout] User is null after loading, rendering null (AuthProvider should redirect)');
    return null; // AuthProvider is expected to handle redirect if !session on protected route
  }

  console.log('[Client DashboardLayout] Rendering main layout');
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}