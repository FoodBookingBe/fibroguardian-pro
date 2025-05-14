'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    async function loadSession() {
      const { data: { session: currentSession } } = await supabase.auth.getSession(); // Renamed to avoid conflict
      setSession(currentSession);
      setUser(currentSession?.user ?? null); // Use nullish coalescing
      setLoading(false);
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => { // Renamed to avoid conflict
          setSession(newSession);
          setUser(newSession?.user ?? null); // Use nullish coalescing
          setLoading(false);
        }
      );
      
      return () => subscription.unsubscribe();
    }
    
    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}