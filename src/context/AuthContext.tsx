import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      (async () => {
        if (!session?.user) {
          setProfile(null);
          return;
        }
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setProfile(data as Profile | null);
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);




  useEffect(() => {
    if (profile) {
      Sentry.setUser({
        id: profile.id,
        username: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || undefined,
        phone: profile.phone || undefined,
        ip_address: '{{auto}}',
        wilaya: profile.wilaya_code || undefined,
        commune_id: profile.commune_id || undefined,
        shop_type_id: profile.shop_type_id || undefined,
        status: profile.status || undefined,
        role: profile.role || undefined,
      });
      Sentry.setTag('wilaya', profile.wilaya_code || 'none');
      Sentry.setTag('shop_type', profile.shop_type_id?.toString() || 'none');
      Sentry.setTag('role', profile.role || 'none');
    } else {
      Sentry.setUser(null);
      Sentry.setTag('wilaya', null);
      Sentry.setTag('shop_type', null);
      Sentry.setTag('role', null);
    }
  }, [profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
