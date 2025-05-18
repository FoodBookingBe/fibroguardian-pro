'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-client'; // Corrected path
import { useRouter, usePathname } from 'next/navigation';
import { Profile } from '@/types'; // Corrected path
import { useProfile } from '@/hooks/useSupabaseQuery'; // Corrected path
import { logger } from '@/lib/monitoring/logger'; // Corrected path, will create this file

// Schema voor auth events voor diagnostiek
type AuthEventType = 
  | 'AUTH_INITIALIZED'
  | 'SESSION_REQUESTED'
  | 'SESSION_LOADED' 
  | 'SESSION_ERROR'
  | 'SESSION_REFRESHED'
  | 'SESSION_EXPIRED'
  | 'TOKEN_REFRESHED'
  | 'TOKEN_REFRESH_ERROR'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'AUTH_ERROR';

interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  sessionId?: string | null;
  userId?: string | null;
  error?: string | null;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadingAuth: boolean;
  loadingProfile: boolean;
  authEvents: AuthEvent[]; // Diagnostiek: historiek van auth events
  lastError: Error | null;
  refreshSession: () => Promise<void>; // Handmatige refresh functie
  lastRefreshAttempt: number | null; // Timestamp van laatste refresh poging
  lastSuccessfulRefresh: number | null; // Timestamp van laatste succesvolle refresh
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  loadingAuth: true,
  loadingProfile: false,
  authEvents: [],
  lastError: null,
  refreshSession: async () => {},
  lastRefreshAttempt: null,
  lastSuccessfulRefresh: null,
});
 
export const useAuth = () => {
  return useContext(AuthContext);
};

// Configuratie voor diagnostiek
const AUTH_DIAGNOSTICS_ENABLED = process.env.NODE_ENV === 'development' || true;
const MAX_AUTH_EVENTS = 100; // Maximum aantal events om bij te houden

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number | null>(null);
  const [lastSuccessfulRefresh, setLastSuccessfulRefresh] = useState<number | null>(null);
  const supabaseRef = useRef<ReturnType<typeof getSupabaseBrowserClient> | null>(null); // Initialize with null
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Supabase client instance on the client side
    if (typeof window !== 'undefined' && !supabaseRef.current) {
      supabaseRef.current = getSupabaseBrowserClient();
    }
  }, []);

  // Functie om auth events te loggen voor diagnostiek
  const logAuthEvent = useCallback((eventType: AuthEventType, metadata?: Record<string, any>, error?: Error | null) => {
    if (!AUTH_DIAGNOSTICS_ENABLED) return;
    
    const newEvent: AuthEvent = {
      type: eventType,
      timestamp: Date.now(),
      // sessionId: session?.id, // Property 'id' does not exist on type 'Session'. Using null or another identifier if needed.
      sessionId: null, // Or derive from token if absolutely necessary and available.
      userId: user?.id,
      error: error ? (error.message || 'Unknown error') : null,
      metadata
    };
    
    setAuthEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, MAX_AUTH_EVENTS);
      
      try {
        localStorage.setItem('fibroguardian_auth_events', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save auth events to localStorage', e);
      }
      
      return updated;
    });
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[Auth Event] ${eventType}`, { 
        ...newEvent, 
        timestamp: new Date(newEvent.timestamp).toISOString() 
      });
    }
  }, [session?.id, user?.id]); // Removed 'session' and 'user' from deps as they are accessed via session?.id and user?.id

  // Functie om sessie handmatig te vernieuwen
  const refreshSession = useCallback(async () => {
    try {
      setLastRefreshAttempt(Date.now());
      logAuthEvent('SESSION_REQUESTED', { manual: true });
      
      const supabase = supabaseRef.current;
      if (!supabase) {
        console.error("[AuthProvider] Supabase client not initialized in refreshSession.");
        logAuthEvent('AUTH_ERROR', { context: 'refreshSession', detail: 'Supabase client missing' });
        return;
      }
      const start = performance.now();
      const { data, error } = await supabase.auth.refreshSession();
      const duration = performance.now() - start;
      
      if (error) {
        setLastError(error);
        logAuthEvent('TOKEN_REFRESH_ERROR', { 
          duration_ms: duration,
          error_code: (error as any).code || 'unknown' // Cast error to any to access code
        }, error);
        console.error("[AuthProvider] Session refresh error:", error.message, error);
        
        try {
          const cookies = document.cookie.split(';').map(c => c.trim());
          const sbCookies = cookies.filter(c => c.startsWith('sb-'));
          logAuthEvent('AUTH_ERROR', { 
            supabase_cookies_present: sbCookies.length > 0,
            cookies_count: cookies.length
          }, error);
        } catch (e) {
          console.error("[AuthProvider] Error inspecting cookies:", e);
        }

        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLastSuccessfulRefresh(Date.now());
        logAuthEvent('TOKEN_REFRESHED', { 
          duration_ms: duration,
          expires_at: data.session.expires_at,
          refresh_token_present: !!data.session.refresh_token
        });
      } else {
        setSession(null);
        setUser(null);
        logAuthEvent('SESSION_EXPIRED', { duration_ms: duration });
      }
    } catch (error) {
      console.error('[AuthProvider] Unexpected error during refreshSession:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);
      logAuthEvent('AUTH_ERROR', { context: 'refreshSession' }, err);
    }
  }, [logAuthEvent]);

  const handleAuthStateChange = useCallback(async (event: string, sessionState: Session | null) => {
    console.log(`[AuthProvider] Auth state change: ${event}`, sessionState ? { 
      user_id: sessionState.user.id,
      expires_at: sessionState.expires_at, 
      expires_in: sessionState.expires_at ? new Date(sessionState.expires_at * 1000).getTime() - Date.now() : null 
    } : 'No session');
    
    let eventType: AuthEventType;
    switch (event) {
      case 'SIGNED_IN':
        eventType = 'SIGNED_IN';
        break;
      case 'SIGNED_OUT':
        eventType = 'SIGNED_OUT';
        break;
      case 'TOKEN_REFRESHED':
        eventType = 'TOKEN_REFRESHED';
        setLastSuccessfulRefresh(Date.now());
        break;
      case 'USER_UPDATED':
        eventType = 'USER_UPDATED';
        break;
      default:
        eventType = 'SESSION_LOADED'; // Default for other events like INITIAL_SESSION, PASSWORD_RECOVERY etc.
    }
    
    logAuthEvent(eventType, { 
      event_name: event,
      session_expires_at: sessionState?.expires_at,
      access_token_length: sessionState?.access_token?.length || 0,
      has_refresh_token: !!sessionState?.refresh_token
    });

    setSession(sessionState);
    const currentUser = sessionState?.user ?? null;
    setUser(currentUser);
    setLoadingAuth(false);
    
    if (sessionState?.expires_at) {
      const expiresAt = new Date(sessionState.expires_at * 1000);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (60 * 1000);
      console.log(`[AuthProvider] Session expires in ${minutesUntilExpiry.toFixed(2)} minutes`, {
        now: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });
      
      if (minutesUntilExpiry < 10) {
        console.warn(`[AuthProvider] Session expiring soon: ${minutesUntilExpiry.toFixed(2)} minutes remaining`);
      }
    }
  }, [logAuthEvent]);

  useEffect(() => {
    setLoadingAuth(true);
    logAuthEvent('AUTH_INITIALIZED');
    
    const supabase = supabaseRef.current;
    if (!supabase) {
      // This might happen if the effect runs before the client initialization effect.
      // However, getSession should ideally wait or be called after client is ensured.
      // For now, we'll let it proceed, but this indicates a potential timing issue if supabase is null.
      // The main useEffect for auth state changes will re-run once supabaseRef.current is set.
      console.warn("[AuthProvider] Supabase client not yet initialized in auth state effect. Will retry.");
      setLoadingAuth(false); // Avoid infinite loading if client never initializes
      return;
    }
    const initStart = performance.now();
    
    supabase.auth.getSession().then(({ data: { session: initialSession } , error: sessionError }) => {
      const duration = performance.now() - initStart;
      
      if (sessionError) {
        console.error("[AuthProvider] Error getting initial session:", sessionError.message);
        setLastError(sessionError);
        logAuthEvent('SESSION_ERROR', { 
          duration_ms: duration,
          error_code: (sessionError as any).code || 'unknown'
        }, sessionError);
        handleAuthStateChange('INITIAL_SESSION_ERROR', null);
      } else if (initialSession) {
        logAuthEvent('SESSION_LOADED', { 
          duration_ms: duration,
          expires_at: initialSession.expires_at,
          access_token_length: initialSession.access_token?.length || 0,
          has_refresh_token: !!initialSession.refresh_token
        });
        handleAuthStateChange('INITIAL_SESSION_SUCCESS', initialSession);
      } else {
        logAuthEvent('SESSION_LOADED', { duration_ms: duration, no_session: true });
        handleAuthStateChange('NO_INITIAL_SESSION', null);
      }
    }).catch(error => {
      console.error("[AuthProvider] Unexpected error in getSession():", error);
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);
      logAuthEvent('AUTH_ERROR', { 
        context: 'getSession',
        duration_ms: performance.now() - initStart
      }, err);
      handleAuthStateChange('INITIAL_SESSION_PROMISE_ERROR', null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessionState) => { // Renamed session to sessionState
      console.log(`[AuthProvider] Auth state change event: ${event}`);
      handleAuthStateChange(event, sessionState); // Pass sessionState
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange, logAuthEvent]);

  useEffect(() => {
    if (!session) return;
    
    const healthCheckInterval = setInterval(() => {
      if (!session) return;
      
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const tokenExpiryBuffer = 10 * 60; 
      
      if (session.expires_at && (session.expires_at - nowInSeconds < tokenExpiryBuffer)) {
        console.log(`[AuthProvider] Token expiring soon, refreshing. Expires in ${session.expires_at - nowInSeconds}s`);
        refreshSession();
      } else {
        console.log('[AuthProvider] Token health check: Token still valid', {
          expires_in_seconds: session.expires_at ? session.expires_at - nowInSeconds : 'unknown',
          check_time: new Date().toISOString()
        });
      }
    }, 5 * 60 * 1000); 
    
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [session, refreshSession]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('sb-')) {
        console.log(`[AuthProvider] Supabase storage changed: ${e.key}`, {
          old_value_length: e.oldValue?.length || 0,
          new_value_length: e.newValue?.length || 0,
          changed_at: new Date().toISOString()
        });
        logAuthEvent('SESSION_LOADED', { // Changed 'AUTH_EVENT' to 'SESSION_LOADED'
          storage_key: e.key,
          has_new_value: !!e.newValue,
          storage_event: true,
          detail: 'Storage event detected, session might have changed in another tab.'
        }, null);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logAuthEvent]);

  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useProfile(user?.id, {
    enabled: !!user,
  });
  
  useEffect(() => {
    if (profileError) {
      console.error('[AuthProvider] Error fetching profile:', profileError);
      logAuthEvent('AUTH_ERROR', { context: 'profileFetch' }, profileError instanceof Error ? profileError : new Error(String(profileError)));
    } else if (profile && user) {
      console.log('[AuthProvider] Profile loaded', { user_id: user.id, profile_type: profile.type });
    }
  }, [profile, profileError, user, logAuthEvent]);
 
  useEffect(() => {
    if (loadingAuth) return;

    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']; 
    const isAuthRoute = authRoutes.some(route => pathname?.startsWith(route));
    const commonProtectedRoutes = [
      '/dashboard', '/taken', '/reflecties', '/rapporten', '/instellingen', '/inzichten', '/auth-test', '/pricing', '/abonnement'
    ];
    const patientOnlyRoutes = ['/mijn-specialisten', '/overzicht'];
    const specialistOnlyRoutes = ['/specialisten/patienten'];

    const isProtectedRoute = 
      commonProtectedRoutes.some(prefix => pathname?.startsWith(prefix)) ||
      patientOnlyRoutes.some(prefix => pathname?.startsWith(prefix)) ||
      specialistOnlyRoutes.some(prefix => pathname?.startsWith(prefix));

    if (session && isAuthRoute) {
      console.log('[AuthProvider] Redirecting authenticated user from auth route to dashboard');
      router.push('/dashboard');
    } else if (!session && isProtectedRoute) {
      console.log('[AuthProvider] Redirecting unauthenticated user from protected route to login', {
        path: pathname,
        session_present: !!session
      });
      router.push('/auth/login');
    } else if (session && profile) {
      if (profile.type === 'patient' && specialistOnlyRoutes.some(prefix => pathname?.startsWith(prefix))) {
        console.log('[AuthProvider] Patient accessing specialist route, redirecting');
        router.push('/dashboard');
      } else if (profile.type === 'specialist' && patientOnlyRoutes.some(prefix => pathname?.startsWith(prefix))) {
        console.log('[AuthProvider] Specialist accessing patient route, redirecting');
        router.push('/dashboard');
      }
    }
  }, [session, profile, loadingAuth, router, pathname]);

  const overallLoading = loadingAuth || (!!user && loadingProfile);

  const authContextValue = {
    user, 
    session, 
    profile: profile ?? null, 
    loading: overallLoading, 
    loadingAuth, 
    loadingProfile,
    authEvents,
    lastError,
    refreshSession,
    lastRefreshAttempt,
    lastSuccessfulRefresh
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      {AUTH_DIAGNOSTICS_ENABLED && process.env.NODE_ENV === 'development' && (
        <div id="auth-debug-overlay" className="hidden fixed bottom-0 right-0 bg-gray-800 text-xs text-white p-2 opacity-75 max-w-xs overflow-auto max-h-48 z-50">
          <div>User: {user?.id ? user.id.substring(0, 6) + '...' : 'Not logged in'}</div>
          <div>Session: {session ? 'Active' : 'None'}</div>
          <div>Expires: {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleTimeString() : 'N/A'}</div>
          <div>Last refresh: {lastSuccessfulRefresh ? new Date(lastSuccessfulRefresh).toLocaleTimeString() : 'Never'}</div>
          <div>Profile: {profile?.type || 'Not loaded'}</div>
          <div className="text-xs mt-1">Recent events:</div>
          <div className="text-xs max-h-20 overflow-y-auto">
            {authEvents.slice(0, 5).map((event, i) => (
              <div key={i} className="opacity-90">
                [{new Date(event.timestamp).toLocaleTimeString()}] {event.type} 
                {event.error ? ` (${event.error})` : ''}
              </div>
            ))}
          </div>
          <button 
            onClick={() => refreshSession()} 
            className="mt-1 text-xs bg-blue-500 hover:bg-blue-600 text-white py-0.5 px-1 rounded">
            Refresh Session
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}
