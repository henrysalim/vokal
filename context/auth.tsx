
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useConfirmModal } from '../src/components/ui/ConfirmModal';

WebBrowser.maybeCompleteAuthSession();

type User = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  phone?: string | null;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isInitializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (name: string, email: string, password: string, familyCode?: string) => Promise<boolean>;
  signUpWithGoogle: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;
  updateProfile: (newName: string, newAvatarUrl?: string | null, newPhone?: string | null) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showConfirm } = useConfirmModal();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchUserProfile = async (userId: string, defaultEmail: string, fallbackName?: string) => {
    try {
      const cachedPhone = await AsyncStorage.getItem(`@vokal_user_phone_${userId}`).catch(() => null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const name = profile?.name || fallbackName || defaultEmail.split('@')[0] || 'Pengguna VOKAL';
      const initials = profile?.avatar_initials || name.substring(0, 2).toUpperCase();
      const avatarUrl = profile?.avatar_url || null;
      const phone = profile?.phone || cachedPhone || null;

      if (!profile) {
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            email: defaultEmail,
            name: name,
            avatar_initials: initials,
          });
        } catch {}
      }

      setUser({
        id: userId,
        name,
        email: defaultEmail,
        avatarInitials: initials,
        avatarUrl,
        phone,
      });
    } catch (e) {
      const cachedPhone = await AsyncStorage.getItem(`@vokal_user_phone_${userId}`).catch(() => null);
      const name = fallbackName || defaultEmail.split('@')[0] || 'Pengguna VOKAL';
      setUser({
        id: userId,
        name,
        email: defaultEmail,
        avatarInitials: name.substring(0, 2).toUpperCase(),
        avatarUrl: null,
        phone: cachedPhone || null,
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
    async (newName: string, newAvatarUrl?: string | null, newPhone?: string | null): Promise<boolean> => {
      const cleanName = newName.trim();
      const cleanPhone = newPhone !== undefined ? (newPhone ? newPhone.trim() : null) : (user?.phone || null);
      if (!cleanName || !user) {
        showConfirm({
          title: 'Nama Tidak Boleh Kosong',
          message: 'Silakan masukkan nama lengkap Anda.',
          confirmText: 'Mengerti',
          cancelText: '',
          variant: 'terracotta',
          iconType: 'warning',
        });
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
        const phoneToSave = cleanPhone;

        if (phoneToSave !== undefined) {
          await AsyncStorage.setItem(`@vokal_user_phone_${user.id}`, phoneToSave || '').catch(() => {});
        }

        if (isSupabaseConfigured()) {
          let { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              name: cleanName,
              avatar_initials: initials,
              avatar_url: avatarUrlToSave,
              phone: phoneToSave,
              email: user.email,
            });

          if (error && error.message && error.message.includes('phone')) {
            const res = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                name: cleanName,
                avatar_initials: initials,
                avatar_url: avatarUrlToSave,
                email: user.email,
              });
            error = res.error;
          }

          if (error) {
            showConfirm({
              title: 'Gagal Memperbarui Profil',
              message: error.message,
              confirmText: 'Tutup',
              cancelText: '',
              variant: 'terracotta',
              iconType: 'danger',
            });
            return false;
          }
        }

        setUser({
          ...user,
          name: cleanName,
          avatarInitials: initials,
          avatarUrl: avatarUrlToSave,
          phone: phoneToSave,
        });

        return true;
      } catch (error: any) {
        console.error('Error updating profile:', error);
        showConfirm({
          title: 'Terjadi Kesalahan',
          message: 'Terjadi kesalahan saat memperbarui profil.',
          confirmText: 'Tutup',
          cancelText: '',
          variant: 'terracotta',
          iconType: 'danger',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, showConfirm]
  );

  useEffect(() => {
    if (isSupabaseConfigured()) {

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
            skipBrowserRedirect: true,
            scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          }
        });

        if (error) {
          showConfirm({
            title: 'Gagal Masuk dengan Google',
            message: error.message,
            confirmText: 'Tutup',
            cancelText: '',
            variant: 'terracotta',
            iconType: 'danger',
          });
          return;
        }

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

          if (result.type === 'success' && result.url) {
            let accessToken = null;
            let refreshToken = null;
            let providerToken = null;

            if (result.url.includes('#')) {
              const hash = result.url.split('#')[1];
              const params = new URLSearchParams(hash);
              accessToken = params.get('access_token');
              refreshToken = params.get('refresh_token');
              providerToken = params.get('provider_token');
            } else {
              const params = new URL(result.url).searchParams;
              accessToken = params.get('access_token');
              refreshToken = params.get('refresh_token');
              providerToken = params.get('provider_token');
            }

            if (accessToken && refreshToken) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

              if (sessionError) {
                showConfirm({
                  title: 'Gagal Mengaitkan Sesi Google',
                  message: sessionError.message,
                  confirmText: 'Tutup',
                  cancelText: '',
                  variant: 'terracotta',
                  iconType: 'danger',
                });
              } else {
                setIsOnboarded(true);

                const finalProviderToken = providerToken || sessionData?.session?.provider_token;
                if (finalProviderToken && sessionData?.session?.user?.id) {
                  const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  await supabase
                    .from('profiles')
                    .update({
                      gmail_access_token: finalProviderToken,
                      gmail_token_obtained_at: new Date().toISOString(),
                      gmail_connected_until: oneMonthLater.toISOString(),
                    })
                    .eq('id', sessionData.session.user.id);
                }
              }
            } else {
              showConfirm({
                title: 'Gagal Masuk',
                message: 'Token otentikasi Google tidak ditemukan dalam respon.',
                confirmText: 'Tutup',
                cancelText: '',
                variant: 'terracotta',
                iconType: 'danger',
              });
            }
          }
        }

      } else {

        setUser({
          id: 'google-dummy-001',
          name: 'Demo Pengguna Google',
          email: 'google-demo@vokal.id',
          avatarInitials: 'GG',
        });
        setIsOnboarded(true);
      }
    } catch (err: any) {
      showConfirm({
        title: 'Error Masuk Google',
        message: err.message || 'Terjadi kesalahan sistem.',
        confirmText: 'Tutup',
        cancelText: '',
        variant: 'terracotta',
        iconType: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showConfirm]);

  const signInWithEmail = useCallback(async (emailInput: string, passwordInput: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      showConfirm({
        title: 'Data Belum Lengkap',
        message: 'Email dan kata sandi wajib diisi.',
        confirmText: 'Mengerti',
        cancelText: '',
        variant: 'terracotta',
        iconType: 'warning',
      });
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
          showConfirm({
            title: 'Gagal Masuk',
            message: error.message,
            confirmText: 'Tutup',
            cancelText: '',
            variant: 'terracotta',
            iconType: 'danger',
          });
          return false;
        }

        if (data.user) {
          await fetchUserProfile(data.user.id, cleanEmail, data.user.user_metadata?.name);
          setIsOnboarded(true);
          return true;
        }
        return false;
      } else {

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
          showConfirm({
            title: 'Gagal Masuk',
            message: 'Pastikan format email benar dan kata sandi minimal 3 karakter.',
            confirmText: 'Mengerti',
            cancelText: '',
            variant: 'terracotta',
            iconType: 'warning',
          });
          return false;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [showConfirm]);

  const signUpWithEmail = useCallback(
    async (nameInput: string, emailInput: string, passwordInput: string, familyCode?: string): Promise<boolean> => {
      const cleanName = nameInput.trim();
      const cleanEmail = emailInput.trim().toLowerCase();
      const cleanPassword = passwordInput.trim();
      const cleanFamilyCode = familyCode?.trim().toUpperCase() || null;

      if (!cleanName || !cleanEmail || !cleanPassword) {
        showConfirm({
          title: 'Data Belum Lengkap',
          message: 'Semua kolom wajib diisi.',
          confirmText: 'Mengerti',
          cancelText: '',
          variant: 'terracotta',
          iconType: 'warning',
        });
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
            showConfirm({
              title: 'Gagal Mendaftar',
              message: error.message,
              confirmText: 'Tutup',
              cancelText: '',
              variant: 'terracotta',
              iconType: 'danger',
            });
            return false;
          }

          if (data.user) {
            const initials = cleanName.substring(0, 2).toUpperCase();

            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });

            if (signInData?.user) {
              await fetchUserProfile(signInData.user.id, cleanEmail, cleanName);

              if (cleanFamilyCode) {
                const { data: otherProfiles } = await supabase
                  .from("profiles")
                  .select("family_id")
                  .eq("family_secret", cleanFamilyCode)
                  .not("family_id", "is", null)
                  .limit(1);

                let targetFamilyId = otherProfiles && otherProfiles.length > 0 ? otherProfiles[0].family_id : null;

                if (!targetFamilyId) {
                  targetFamilyId = "fam_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
                }

                await supabase
                  .from("profiles")
                  .update({
                    family_id: targetFamilyId,
                    family_secret: cleanFamilyCode
                  })
                  .eq("id", signInData.user.id);
              }
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
        showConfirm({
          title: 'Error Pendaftaran',
          message: err.message || 'Terjadi kesalahan sistem.',
          confirmText: 'Tutup',
          cancelText: '',
          variant: 'terracotta',
          iconType: 'danger',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [showConfirm],
  );

  const signUpWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const signOut = useCallback(async () => {
    console.log("signOut callback triggered in AuthContext");
    try {
      if (isSupabaseConfigured()) {
        console.log("Supabase is configured, calling supabase.auth.signOut()...");
        const {error} = await supabase.auth.signOut();
        if (error) {
          console.error("Gagal signOut dari Supabase: ", error.message);
        } else {
          console.log("Supabase auth.signOut() completed successfully");
        }
      } else {
        console.log("Supabase not configured, signing out of dummy session");
      }
    } catch (err) {
      console.error("Error saat logout: ", err);
    } finally {
      console.log("Setting user state to null in AuthContext");
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
