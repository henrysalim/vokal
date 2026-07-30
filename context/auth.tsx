/**
 * AuthContext — VOKAL dummy auth state
 *
 * Provides minimal auth/onboarding state for the app shell.
 * Demo credentials:
 * Email: vokal@vokal.com
 * Password: vokal
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
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
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<boolean>;
  signUpWithGoogle: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // ── Dummy sign-in helpers ─────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    Alert.alert(
      'Google Sign-In',
      'Google OAuth akan dihubungkan ke Supabase setelah setup backend. Masuk sebagai pengguna demo?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Demo Login',
          onPress: () => {
            setUser({
              id: 'google-dummy-001',
              name: 'Demo Pengguna',
              email: 'vokal@vokal.com',
              avatarInitials: 'DP',
            });
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
      await new Promise((r) => setTimeout(r, 500)); // Simulate network

      if (cleanEmail === 'vokal@vokal.com' && cleanPassword === 'vokal') {
        setUser({
          id: 'vokal-user-001',
          name: 'VOKAL User',
          email: 'vokal@vokal.com',
          avatarInitials: 'VU',
        });
        return true;
      } else {
        Alert.alert(
          'Gagal Masuk',
          'Email atau kata sandi salah.\n\nKredensial Demo:\nEmail: vokal@vokal.com\nKata Sandi: vokal'
        );
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      if (!name || !email || !password) {
        Alert.alert('Error', 'Semua kolom wajib diisi.');
        return false;
      }
      setIsLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 500));
        const initials = name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        setUser({ id: `email-user-${Date.now()}`, name, email, avatarInitials: initials });
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signUpWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const signOut = useCallback(() => {
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
