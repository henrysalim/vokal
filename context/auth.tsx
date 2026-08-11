/**
 * AuthContext — VOKAL Auth state (Supports Supabase Auth & Local Demo Mode)
 */
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type User = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isInitializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<boolean>;
  signUpWithGoogle: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;
  updateProfile: (newName: string, newAvatarUrl?: string | null) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchUserProfile = async (userId: string, defaultEmail: string, fallbackName?: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const name = profile?.name || fallbackName || defaultEmail.split('@')[0] || 'Pengguna VOKAL';
      const initials = profile?.avatar_initials || name.substring(0, 2).toUpperCase();
      const avatarUrl = profile?.avatar_url || null;

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
        avatarUrl
      });
    } catch (e) {
      const name = fallbackName || defaultEmail.split('@')[0] || 'Pengguna VOKAL';
      setUser({
        id: userId,
        name,
        email: defaultEmail,
        avatarInitials: name.substring(0, 2).toUpperCase(),
        avatarUrl: null
      });
    }
  };

  useEffect(() => {
    async function initAuth() {
      try {
        const onboardedVal = await AsyncStorage.getItem('@vokal_onboarded');
        const hasOnBoardedFlag = onboardedVal === 'true';
        
        if (isSupabaseConfigured()) {
          const {data: {session}} = await supabase.auth.getSession();
          if (session?.user) {
            const u = session?.user;
            await fetchUserProfile(u?.id, u?.email || '', u?.user_metadata.name)
            setIsOnboarded(true);
          } else {
            setIsOnboarded(hasOnBoardedFlag)
          }
        } else {
          setIsOnboarded(hasOnBoardedFlag)
        }
      } catch(err) {
        console.error('Init Auth Error:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    initAuth();

    if (isSupabaseConfigured()) {
      const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const u = session.user;
          fetchUserProfile(u.id, u.email || '', u.user_metadata?.name);
          setIsOnboarded(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [])

  useEffect(() => {
    AsyncStorage.getItem('@vokal_onboarded').then((val) => {

      if (val === 'true') {
        setIsOnboarded(true)
      }
    })
  }, []);

  const updateProfile = useCallback(
    async (newName: string, newAvatarUrl?: string | null): Promise<boolean> => {
      const cleanName = newName.trim();
      if (!cleanName || !user) {
        Alert.alert('Error', 'Nama tidak boleh kosong.');
        return false;
      }

      setIsLoading(true);
      try {
        const initials = cleanName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

        const avatarUrlToSave = newAvatarUrl !== undefined ? newAvatarUrl : user.avatarUrl;

        if (isSupabaseConfigured()) {
          const {error} = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              name: cleanName,
              avatar_initials: initials,
              avatar_url: avatarUrlToSave,
              email: user.email,
            })

          if (error) {
            Alert.alert('Gagal Memperbarui Profil', error.message);
            return false
          }
        }

        // Update local user state
        setUser({
          ...user,
          name: cleanName,
          avatarInitials: initials,
          avatarUrl: avatarUrlToSave
        });

        return true;
      } catch (error: any) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat memperbarui profil');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

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
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'vokal'
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // Kita lewati otomatisasi redirect bawaan Supabase
          }
        });

        if (error) {
          Alert.alert('Gagal Google Login', error.message);
          return;
        }

        if (data?.url) {
          // Buka web browser native untuk Google Sign In secara paksa
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          
          if (result.type === 'success' && result.url) {
            let accessToken = null;
            let refreshToken = null;

            // Supabase OAuth callback biasanya mengembalikan token di fragment (#access_token=...)
            if (result.url.includes('#')) {
              const hash = result.url.split('#')[1];
              const params = new URLSearchParams(hash);
              accessToken = params.get('access_token');
              refreshToken = params.get('refresh_token');
            } else {
              // Cadangan parsing via query parameter
              const params = new URL(result.url).searchParams;
              accessToken = params.get('access_token');
              refreshToken = params.get('refresh_token');
            }
            
            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

              if (sessionError) {
                Alert.alert('Gagal Mengaitkan Sesi Google', sessionError.message);
              } else {
                setIsOnboarded(true);
              }
            } else {
              Alert.alert('Gagal Login', 'Token otentikasi Google tidak ditemukan dalam respon.');
            }
          }
        }
      } else {
        // Fallback Demo Login jika Supabase belum terkonfigurasi
        setUser({
          id: 'google-dummy-001',
          name: 'Demo Pengguna Google',
          email: 'google-demo@vokal.id',
          avatarInitials: 'GG',
        });
        setIsOnboarded(true);
      }
    } catch (err: any) {
      Alert.alert('Error Google Login', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
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
    try {
      if (isSupabaseConfigured()) {
        const {error} = await supabase.auth.signOut();
        if (error) {
          console.error("Gagal signOUt dari Supabase: ", error.message)
        } 
      }
    } catch (err) {
      console.error("Error saat logout: ", err);
    } finally {
      setUser(null);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem('@vokal_onboarded', 'true');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOnboarded,
        isInitializing,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signUpWithGoogle,
        signOut,
        completeOnboarding,
        updateProfile
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
