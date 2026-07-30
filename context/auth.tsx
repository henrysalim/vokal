/**
 * AuthContext — VOKAL dummy auth state
 *
 * Provides minimal auth/onboarding state for the app shell.
 * No backend calls are made here. When Supabase is set up, replace
 * signInWithEmail() / signInWithGoogle() bodies with real SDK calls.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // In a real app, persist this in AsyncStorage or SecureStore
  const [isOnboarded, setIsOnboarded] = useState(false);

  // ── Dummy sign-in helpers ─────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    // TODO: Replace with real Supabase Google OAuth when backend is ready
    Alert.alert(
      'Google Sign-In',
      'Google OAuth akan dihubungkan ke Supabase setelah setup backend. Untuk demo, masuk sebagai pengguna dummy.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Demo Login',
          onPress: () => {
            setUser({
              id: 'google-dummy-001',
              name: 'Demo Pengguna',
              email: 'demo@vokal.app',
              avatarInitials: 'DP',
            });
          },
        },
      ],
    );
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan kata sandi wajib diisi.');
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Replace with Supabase auth.signInWithPassword({ email, password })
      await new Promise((r) => setTimeout(r, 800)); // Simulate network
      const namePart = email.split('@')[0];
      const initials = namePart.slice(0, 2).toUpperCase();
      setUser({
        id: `email-user-${Date.now()}`,
        name: namePart,
        email,
        avatarInitials: initials,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      if (!name || !email || !password) {
        Alert.alert('Error', 'Semua kolom wajib diisi.');
        return;
      }
      setIsLoading(true);
      try {
        // TODO: Replace with Supabase auth.signUp({ email, password, options: { data: { name } } })
        await new Promise((r) => setTimeout(r, 800));
        const initials = name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        setUser({ id: `email-user-${Date.now()}`, name, email, avatarInitials: initials });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signUpWithGoogle = useCallback(async () => {
    // Reuse same Google stub
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(() => {
    // TODO: Persist with AsyncStorage.setItem('vokal_onboarded', '1')
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
