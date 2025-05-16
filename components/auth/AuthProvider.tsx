'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js'; // AuthError might be useful for error handling
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
 
export const useAuth = () => {
  // console.log('[AuthProvider] useAuth called, consuming context.'); // This might be too noisy if called often
  return useContext(AuthContext);
};
 
export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('[AuthProvider] AuthProvider component rendering/re-rendering'); // Log when AuthProvider itself renders
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null); // Added authError state
  const router = useRouter(); 
  const pathname = usePathname(); 

  const handleAuthStateChange = useCallback((_event: string, sessionState: Session | null) => {
    setSession(sessionState);
    setUser(sessionState?.user ?? null);
    setLoading(false);
    setAuthError(null); // Clear error on successful auth state change
  }, []);

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth session...');
    setLoading(true);
    setAuthError(null); // Clear previous errors
    const supabase = getSupabaseBrowserClient();
    
    // Add more detailed error handling and logging
    supabase.auth.getSession().then((response: { data: { session: Session | null }, error: AuthError | null }) => {
      if (response.error) {
        console.error("[AuthProvider] Error getting session:", response.error.message);
        setAuthError(response.error.message); // Set authError state
        // Optionally clear session and user
        setSession(null);
        setUser(null);
      } else {
        setAuthError(null); // Clear error if session is retrieved successfully
      }
      
      const currentSession = response.data.session;
      console.log('[AuthProvider] Initial session retrieved:', {
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        userEmail: currentSession?.user?.email,
      });
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      
      // Debug log suggested by user
      console.log("AUTH SESSION CHECK (initial getSession):", {
        hasSession: !!currentSession,
        hasUser: !!currentSession?.user,
        error: response.error?.message,
        sessionExpiry: currentSession?.expires_at
          ? new Date(currentSession.expires_at * 1000).toISOString()
          : 'No expiry',
        cookies: typeof document !== 'undefined' ? document.cookie.split(';').filter(c => c.trim().startsWith('sb-')) : 'No document/cookies (server?)',
      });
    }).catch(err => {
      console.error('[AuthProvider] Unexpected error in getSession:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessionState) => {
      console.log("AUTH STATE CHANGE EVENT:", event, {
        hasSession: !!sessionState,
        hasUser: !!sessionState?.user,
        sessionExpiry: sessionState?.expires_at
          ? new Date(sessionState.expires_at * 1000).toISOString()
          : 'No expiry',
        cookies: typeof document !== 'undefined' ? document.cookie.split(';').filter(c => c.trim().startsWith('sb-')) : 'No document/cookies (server?)',
      });
      handleAuthStateChange(event, sessionState);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  useEffect(() => {
    if (loading) return; 

    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']; 
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const protectedRoutePrefixes = [
      '/dashboard', '/taken', '/reflecties', '/rapporten', '/instellingen', '/specialisten',
      '/inzichten', '/auth-test'
    ];
    
    // These paths were causing redirection issues, so we handle them separately
    const specialProtectedPaths = [
      '/mijn-specialisten', '/overzicht'
    ];
    const isProtectedRoute = protectedRoutePrefixes.some(prefix => pathname.startsWith(prefix));

    const isSpecialProtectedRoute = specialProtectedPaths.some(prefix => pathname.startsWith(prefix));

    if (session && isAuthRoute) {
      // User is logged in but on an auth page, redirect to dashboard
      console.log('AuthProvider: Logged in user on auth route, redirecting to /dashboard with hard navigation');
      window.location.href = '/dashboard';
    } else if (!session && isProtectedRoute) {
      // User is not logged in and on a protected page, redirect to login
      console.log('AuthProvider: Unauthenticated user on protected route, redirecting to /auth/login');
      router.push('/auth/login');
    } else if (!session && isSpecialProtectedRoute) {
      // User is not logged in and on a special protected page, redirect to login
      console.log('AuthProvider: Unauthenticated user on special protected route, redirecting to /auth/login');
      router.push('/auth/login');
    }
  }, [session, loading, router, pathname]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
