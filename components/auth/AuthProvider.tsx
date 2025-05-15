'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User, AuthSessionResponse } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
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
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then((response: AuthSessionResponse) => {
      const currentSession = response.data.session;
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
    if (loading) return; 

    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']; 
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const protectedRoutePrefixes = ['/dashboard', '/taken', '/reflecties', '/rapporten', '/instellingen', '/specialisten'];
    const isProtectedRoute = protectedRoutePrefixes.some(prefix => pathname.startsWith(prefix));

    // TEMPORARILY DISABLE REDIRECTING LOGGED-IN USER FROM AUTH PAGE
    // if (session && isAuthRoute) {
    //   // User is logged in but on an auth page, redirect to dashboard
    //   console.log('AuthProvider: Logged in user on auth route, redirecting to /dashboard');
    //   router.push('/dashboard');
    // } else 
    if (!session && isProtectedRoute) {
      // User is not logged in and on a protected page, redirect to login
      console.log('AuthProvider: Unauthenticated user on protected route, redirecting to /auth/login');
      router.push('/auth/login');
    }
  }, [session, loading, router, pathname]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
