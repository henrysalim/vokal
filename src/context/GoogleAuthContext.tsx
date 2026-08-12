
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '';
const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  (Constants as any).appOwnership === 'expo';

const EXPO_PROXY_REDIRECT_URI = 'https://auth.expo.io/@henrysalim/vokal';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

type GoogleAuthContextValue = {

  isGoogleConnected: boolean;

  googleAccessToken: string | null;

  googleUserEmail: string | null;

  isConnecting: boolean;

  connectGoogle: () => Promise<string | null>;

  disconnectGoogle: () => Promise<void>;

  ensureFreshToken: () => Promise<string | null>;
};

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('gmail_access_token, gmail_token_obtained_at, gmail_connected_until, email')
        .eq('id', session.user.id)
        .single();

      if (!profile?.gmail_access_token || !profile?.gmail_connected_until) return;

      const connectedUntil = new Date(profile.gmail_connected_until).getTime();
      if (Date.now() > connectedUntil) {
        await clearStoredToken(session.user.id);
        return;
      }

      setGoogleAccessToken(profile.gmail_access_token);
      setGoogleUserEmail(profile.email || session.user.email || null);
      setIsGoogleConnected(true);
    } catch {}
  };

  const handleTokenReceived = async (token: string): Promise<string | null> => {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await userInfoRes.json();
      const email: string | null = userInfo.email || null;

      await persistToken(token, email);

      setGoogleAccessToken(token);
      setGoogleUserEmail(email);
      setIsGoogleConnected(true);
      return token;
    } catch {
      setGoogleAccessToken(token);
      setIsGoogleConnected(true);
      return token;
    } finally {
      setIsConnecting(false);
    }
  };

  const persistToken = async (token: string, email: string | null) => {
    if (!isSupabaseConfigured()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const now = new Date();
    const connectedUntil = new Date(now.getTime() + ONE_MONTH_MS);

    await supabase
      .from('profiles')
      .update({
        gmail_access_token: token,
        gmail_token_obtained_at: now.toISOString(),
        gmail_connected_until: connectedUntil.toISOString(),
      })
      .eq('id', session.user.id);
  };

  const clearStoredToken = async (userId?: string) => {
    if (!isSupabaseConfigured()) return;
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id;
    }
    if (!uid) return;
    await supabase
      .from('profiles')
      .update({ gmail_access_token: null, gmail_token_obtained_at: null, gmail_connected_until: null })
      .eq('id', uid);
  };

  const connectGoogle = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true);
    try {
      if (!GOOGLE_CLIENT_ID) {
        Alert.alert('Client ID Belum Dikonfigurasi', 'Tambahkan EXPO_PUBLIC_GOOGLE_CLIENT_ID ke file .env kamu.', [{ text: 'OK' }]);
        return null;
      }

      const proxyRedirectUri = 'https://auth.expo.io/@henrysalim/vokal';
      const returnUrl = isExpoGo ? AuthSession.makeRedirectUri() : AuthSession.makeRedirectUri({ scheme: 'vokal' });

      const request = await AuthSession.loadAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'],
          redirectUri: isExpoGo ? proxyRedirectUri : returnUrl,
          responseType: AuthSession.ResponseType.Code,
          usePKCE: true,
        },
        discovery
      );

      const authUrl = await request.makeAuthUrlAsync(discovery);

      let result: WebBrowser.WebBrowserAuthSessionResult;
      if (isExpoGo) {
        const startUrl = `https://auth.expo.io/@henrysalim/vokal/start?authUrl=${encodeURIComponent(authUrl)}&returnUrl=${encodeURIComponent(returnUrl)}`;
        result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
      } else {
        result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      }

      if (result.type === 'success' && result.url) {
        let code: string | null = null;
        try {
          const parsed = new URL(result.url);
          code = parsed.searchParams.get('code');
        } catch {
          const match = result.url.match(/[?&]code=([^&]+)/);
          if (match) code = decodeURIComponent(match[1]);
        }

        if (code) {
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId: GOOGLE_CLIENT_ID,
              clientSecret: GOOGLE_CLIENT_SECRET,
              code,
              redirectUri: isExpoGo ? proxyRedirectUri : returnUrl,
              extraParams: {
                code_verifier: request.codeVerifier || '',
              },
            },
            discovery
          );

          if (tokenResult.accessToken) {
            return await handleTokenReceived(tokenResult.accessToken);
          } else {
            Alert.alert('Gagal Otorisasi Google', 'Token akses Google tidak dapat ditemukan.');
          }
        } else {
          Alert.alert('Gagal Otorisasi Google', 'Kode otorisasi tidak ditemukan.');
        }
      } else if (result.type === 'dismiss' || result.type === 'cancel') {
        // User cancelled auth session
      } else {
        Alert.alert(
          'Gagal Otorisasi Google',
          'Proses otorisasi dibatalkan atau terjadi kesalahan.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error Otorisasi Gmail', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsConnecting(false);
    }
    return null;
  }, []);

  const disconnectGoogle = useCallback(async () => {
    setGoogleAccessToken(null);
    setGoogleUserEmail(null);
    setIsGoogleConnected(false);
    await clearStoredToken();
  }, []);

  const ensureFreshToken = useCallback(async (): Promise<string | null> => {
    if (googleAccessToken && isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('gmail_token_obtained_at, gmail_connected_until')
            .eq('id', session.user.id)
            .single();

          if (profile?.gmail_token_obtained_at && profile?.gmail_connected_until) {
            const obtainedAt = new Date(profile.gmail_token_obtained_at).getTime();
            const connectedUntil = new Date(profile.gmail_connected_until).getTime();

            if (Date.now() > connectedUntil) {
              await clearStoredToken(session.user.id);
              setGoogleAccessToken(null);
              setIsGoogleConnected(false);
              return null;
            }

            if (Date.now() - obtainedAt < ONE_HOUR_MS) {
              return googleAccessToken;
            }
          }
        }
      } catch {
        return googleAccessToken;
      }
    }

    if (isGoogleConnected) {
      return connectGoogle();
    }
    return null;
  }, [googleAccessToken, isGoogleConnected, connectGoogle]);

  return (
    <GoogleAuthContext.Provider
      value={{ isGoogleConnected, googleAccessToken, googleUserEmail, isConnecting, connectGoogle, disconnectGoogle, ensureFreshToken }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error('useGoogleAuth must be used inside <GoogleAuthProvider>');
  return ctx;
}
