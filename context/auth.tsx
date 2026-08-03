/**
 * AuthContext — VOKAL Auth state (Supports Supabase Auth & Local Demo Mode)
 */
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

type User = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<boolean>;
  signUpWithGoogle: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const fetchUserProfile = async (userId: string, defaultEmail: string, fallbackName?: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const name = profile?.name || fallbackName || defaultEmail.split('@')[0] || 'Pengguna VOKAL';
      const initials = profile?.avatar_initials || name.substring(0, 2).toUpperCase();

      // Upsert profile safely once authenticated
      if (!profile) {
        await supabase.from('profiles').upsert({
          id: userId,
          email: defaultEmail,
          name: name,
          avatar_initials: initials,
        });
      }

      setUser({
        id: userId,
        name,
        email: defaultEmail,
        avatarInitials: initials,
      });
    } catch (e) {
      const name = fallbackName || defaultEmail.split('@')[0] || 'Pengguna VOKAL';
      setUser({
        id: userId,
        name,
        email: defaultEmail,
        avatarInitials: name.substring(0, 2).toUpperCase(),
      });
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          fetchUserProfile(u.id, u.email || '', u.user_metadata?.name);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const u = session.user;
          fetchUserProfile(u.id, u.email || '', u.user_metadata?.name);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    Alert.alert(
      'Google Sign-In',
      'Google OAuth akan dihubungkan ke Supabase. Masuk sebagai pengguna demo?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Demo Login',
          onPress: () => {
            setUser({
              id: 'google-dummy-001',
              name: 'Demo Pengguna',
              email: 'vokal@vokal.id',
              avatarInitials: 'DP',
            });
            setIsOnboarded(true);
          },
        },
      ],
    );
  }, []);

  const signInWithEmail = useCallback(async (emailInput: string, passwordInput: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Error', 'Email dan kata sandi wajib diisi.');
      return false;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          Alert.alert('Gagal Masuk', error.message);
          return false;
        }

        if (data.user) {
          await fetchUserProfile(data.user.id, cleanEmail, data.user.user_metadata?.name);
          setIsOnboarded(true);
          return true;
        }
        return false;
      } else {
        // Fallback Demo mode
        await new Promise((r) => setTimeout(r, 400));
        if (cleanEmail.includes('@') && cleanPassword.length >= 3) {
          const name = cleanEmail.split('@')[0].toUpperCase();
          setUser({
            id: 'vokal-user-001',
            name,
            email: cleanEmail,
            avatarInitials: name.substring(0, 2).toUpperCase(),
          });
          setIsOnboarded(true);
          return true;
        } else {
          Alert.alert(
            'Gagal Masuk',
            'Pastikan format email benar dan kata sandi minimal 3 karakter.'
          );
          return false;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (nameInput: string, emailInput: string, passwordInput: string): Promise<boolean> => {
      const cleanName = nameInput.trim();
      const cleanEmail = emailInput.trim().toLowerCase();
      const cleanPassword = passwordInput.trim();

      if (!cleanName || !cleanEmail || !cleanPassword) {
        Alert.alert('Error', 'Semua kolom wajib diisi.');
        return false;
      }
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: { name: cleanName }
            }
          });

          if (error) {
            Alert.alert('Gagal Mendaftar', error.message);
            return false;
          }

          if (data.user) {
            const initials = cleanName.substring(0, 2).toUpperCase();

            // Try auto-signin if email confirmation is disabled in Supabase
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });

            if (signInData?.user) {
              await fetchUserProfile(signInData.user.id, cleanEmail, cleanName);
            } else {
              setUser({ id: data.user.id, name: cleanName, email: cleanEmail, avatarInitials: initials });
            }

            setIsOnboarded(true);
            return true;
          }
          return false;
        } else {
          await new Promise((r) => setTimeout(r, 400));
          const initials = cleanName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          setUser({ id: `email-user-${Date.now()}`, name: cleanName, email: cleanEmail, avatarInitials: initials });
          setIsOnboarded(true);
          return true;
        }
      } catch (err: any) {
        Alert.alert('Error Pendaftaran', err.message || 'Terjadi kesalahan sistem.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signUpWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboarded(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOnboarded,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signUpWithGoogle,
        signOut,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
