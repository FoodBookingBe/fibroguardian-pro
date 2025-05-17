'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import { Profile } from '@/types';
import { useProfile } from '@/hooks/useSupabaseQuery'; // Import useProfile

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null; // Added profile
  loading: boolean; // Overall loading state (auth + profile)
  loadingAuth: boolean; // Specific to auth session loading
  loadingProfile: boolean; // Specific to profile loading
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  loadingAuth: true,
  loadingProfile: false,
});
 
export const useAuth = () => {
  return useContext(AuthContext);
};
 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // const [profile, setProfile] = useState<Profile | null>(null); // Will come from useProfile
  const [loadingAuth, setLoadingAuth] = useState(true); // For auth session
  // const [loadingProfile, setLoadingProfile] = useState(false); // Will come from useProfile
  const router = useRouter();
  const pathname = usePathname(); 

  const handleAuthStateChange = useCallback((_event: string, sessionState: Session | null) => {
    setSession(sessionState);
    const currentUser = sessionState?.user ?? null;
    setUser(currentUser);
    // Profile will be cleared/refetched by useProfile hook when user changes
    setLoadingAuth(false);
    // setAuthError(null);
  }, []);

  // Effect for fetching initial session and listening to auth changes
  useEffect(() => {
    setLoadingAuth(true);
    // setAuthError(null);
    const supabase = getSupabaseBrowserClient();
    
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("[AuthProvider] Error getting session:", error.message);
        // setAuthError(error.message);
        setSession(null);
        setUser(null);
        // Profile will be null if user is null via useProfile
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      setLoadingAuth(false);
      // .catch is not needed here as error is handled in the .then callback
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Fetch profile using useProfile hook
  const {
    data: profile,
    isLoading: loadingProfile,
    // error: profileError, // Errors can be handled globally or locally if needed
  } = useProfile(user?.id, {
    enabled: !!user, // Only fetch if user is available
  });
 
  // Effect for route protection
  useEffect(() => {
    if (loadingAuth) return; // Wait for auth state to be determined

    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']; 
    const isAuthRoute = authRoutes.some(route => pathname?.startsWith(route));
    const commonProtectedRoutes = [ // Routes accessible by both patients and specialists
      '/dashboard', '/taken', '/reflecties', '/rapporten', '/instellingen', '/inzichten', '/auth-test', '/pricing', '/abonnement'
    ];
    const patientOnlyRoutes = ['/mijn-specialisten', '/overzicht']; // Example
    const specialistOnlyRoutes = ['/specialisten/patienten']; // Example

    const isProtectedRoute = 
      commonProtectedRoutes.some(prefix => pathname?.startsWith(prefix)) ||
      patientOnlyRoutes.some(prefix => pathname?.startsWith(prefix)) ||
      specialistOnlyRoutes.some(prefix => pathname?.startsWith(prefix));

    if (session && isAuthRoute) {
      router.push('/dashboard');
    } else if (!session && isProtectedRoute) {
      router.push('/auth/login');
    } else if (session && profile) { // Check profile type for role-based access
      if (profile.type === 'patient' && specialistOnlyRoutes.some(prefix => pathname?.startsWith(prefix))) {
        router.push('/dashboard'); // Or an "unauthorized" page
      } else if (profile.type === 'specialist' && patientOnlyRoutes.some(prefix => pathname?.startsWith(prefix))) {
        router.push('/dashboard'); // Or an "unauthorized" page
      }
    }
  }, [session, profile, loadingAuth, router, pathname]);

  // Combined loading state
  const overallLoading = loadingAuth || (!!user && loadingProfile);

  return (
    <AuthContext.Provider value={{ user, session, profile: profile ?? null, loading: overallLoading, loadingAuth, loadingProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
