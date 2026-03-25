'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getAuthClient } from '@/lib/auth';
import { syncLocalProgressToCloud } from '@/lib/progress';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const SESSION_STORAGE_KEY = 'dcl-auth-session';

function persistSession(session: Session | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch { /* localStorage unavailable */ }
}

function restoreSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const manualSignOut = useRef(false);

  useEffect(() => {
    const supabase = getAuthClient();

    // Get initial session — fall back to localStorage if offline / SDK returns null
    supabase.auth.getSession().then(({ data: { session: sdkSession } }) => {
      if (sdkSession) {
        setSession(sdkSession);
        setUser(sdkSession.user);
        persistSession(sdkSession);
      } else {
        // Offline or expired — restore cached session so UI stays logged-in
        const cached = restoreSession();
        if (cached) {
          setSession(cached);
          setUser(cached.user);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_OUT') {
          // Only clear state if the user explicitly signed out
          if (manualSignOut.current) {
            setSession(null);
            setUser(null);
            persistSession(null);
            manualSignOut.current = false;
          }
          // Otherwise keep the cached session (network-induced logout)
          setLoading(false);
          return;
        }

        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          persistSession(newSession);
        }
        setLoading(false);

        // Sync local progress to cloud when user signs in
        if (event === 'SIGNED_IN' && newSession?.user) {
          syncLocalProgressToCloud();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    manualSignOut.current = true;
    const supabase = getAuthClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    persistSession(null);
  };

  // Mount offline sync - processes queued mutations/uploads when coming back online
  useOfflineSync(session?.access_token, user?.id);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
