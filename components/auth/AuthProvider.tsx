'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation'; // Added

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthStateChange = useCallback((_event: string, sessionState: Session | null) => {
    setSession(sessionState);
    setUser(sessionState?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  useEffect(() => {
    if (loading) return; // Don't do anything while loading session

    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']; // Add other auth-specific routes
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    // Define protected routes (could be more dynamic or come from config)
    // For now, any route that is NOT an auth route and NOT the homepage is considered protected if no session.
    // Or, more explicitly:
    const protectedRoutePrefixes = ['/dashboard', '/taken', '/reflecties', '/rapporten', '/instellingen', '/specialisten'];
    const isProtectedRoute = protectedRoutePrefixes.some(prefix => pathname.startsWith(prefix));

    if (session && isAuthRoute) {
      // User is logged in but on an auth page, redirect to dashboard after a small delay
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 100); // 100ms delay
      return () => clearTimeout(timer); // Cleanup timeout
    } else if (!session && isProtectedRoute) {
      // User is not logged in and on a protected page, redirect to login after a small delay
       const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 100); // 100ms delay
      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [session, loading, router, pathname]); // Dependencies remain the same

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}