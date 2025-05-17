'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js'; // AuthError was unused
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Profile } from '@/types'; // Import Profile type

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // For auth session
  const [loadingProfile, setLoadingProfile] = useState(false); // For profile data
  // const [authError, setAuthError] = useState<string | null>(null); // authError state was not used
  const router = useRouter(); 
  const pathname = usePathname(); 

  const handleAuthStateChange = useCallback((_event: string, sessionState: Session | null) => {
    setSession(sessionState);
    const currentUser = sessionState?.user ?? null;
    setUser(currentUser);
    if (!currentUser) { // If user logs out, clear profile
      setProfile(null);
    }
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
        setProfile(null); // Clear profile on error
      } else {
        // setAuthError(null);
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

  // Effect for fetching user profile when user object changes
  useEffect(() => {
    if (user && !profile) { // Fetch profile if user exists and profile is not yet loaded
      setLoadingProfile(true);
      const supabase = getSupabaseBrowserClient();
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('[AuthProvider] Error fetching profile:', error.message);
            // setAuthError(error.message); // Can use authError or a separate profileError state
            setProfile(null);
          } else {
            setProfile(data as Profile | null);
          }
          setLoadingProfile(false);
        });
        // .catch(err => { // This .catch is likely redundant as .then handles the error from Supabase client
        //   console.error('[AuthProvider] Unexpected error fetching profile:', err);
        //   setLoadingProfile(false);
        // });
    } else if (!user) {
      setProfile(null); // Clear profile if user logs out
    }
  }, [user]); // Re-run when user changes

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
    <AuthContext.Provider value={{ user, session, profile, loading: overallLoading, loadingAuth, loadingProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
