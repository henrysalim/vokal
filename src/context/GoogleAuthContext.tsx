import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useConfirmModal } from "../components/ui/ConfirmModal";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

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

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showConfirm } = useConfirmModal();
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    null,
  );
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("gmail_access_token, gmail_connected_until, email")
        .eq("id", session.user.id)
        .single();

      if (!profile?.gmail_access_token || !profile?.gmail_connected_until)
        return;

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

  const clearStoredToken = async (userId?: string) => {
    if (!isSupabaseConfigured()) return;
    let uid = userId;
    if (!uid) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      uid = session?.user?.id;
    }
    if (!uid) return;
    await supabase
      .from("profiles")
      .update({
        gmail_access_token: null,
        gmail_token_obtained_at: null,
        gmail_connected_until: null,
      })
      .eq("id", uid);
    setGoogleAccessToken(null);
    setGoogleUserEmail(null);
    setIsGoogleConnected(false);
  };

  const connectGoogle = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true);
    try {
      if (!isSupabaseConfigured()) {
        showConfirm({
          title: "Konfigurasi Belum Lengkap",
          message: "Supabase belum dikonfigurasi.",
          confirmText: "Mengerti",
          cancelText: "",
          variant: "terracotta",
          iconType: "warning",
        });
        return null;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        showConfirm({
          title: "Belum Masuk",
          message: "Silakan masuk terlebih dahulu untuk menggunakan fitur ini.",
          confirmText: "Mengerti",
          cancelText: "",
          variant: "mustard",
          iconType: "warning",
        });
        return null;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("gmail_access_token, gmail_connected_until, email")
        .eq("id", session.user.id)
        .single();

      if (profile?.gmail_access_token && profile?.gmail_connected_until) {
        const connectedUntil = new Date(
          profile.gmail_connected_until,
        ).getTime();
        if (Date.now() <= connectedUntil) {
          setGoogleAccessToken(profile.gmail_access_token);
          setGoogleUserEmail(profile.email || session.user.email || null);
          setIsGoogleConnected(true);
          return profile.gmail_access_token;
        }
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "vokal",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          scopes:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        );

        if (result.type === "success" && result.url) {
          let accessToken = null;
          let refreshToken = null;
          let providerToken = null;

          if (result.url.includes("#")) {
            const hash = result.url.split("#")[1];
            const params = new URLSearchParams(hash);
            accessToken = params.get("access_token");
            refreshToken = params.get("refresh_token");
            providerToken = params.get("provider_token");
          } else {
            const params = new URL(result.url).searchParams;
            accessToken = params.get("access_token");
            refreshToken = params.get("refresh_token");
            providerToken = params.get("provider_token");
          }

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              throw new Error(sessionError.message);
            }

            const finalProviderToken =
              providerToken || sessionData?.session?.provider_token;
            if (finalProviderToken && sessionData?.session?.user?.id) {
              const oneMonthLater = new Date(Date.now() + ONE_MONTH_MS);
              await supabase
                .from("profiles")
                .update({
                  gmail_access_token: finalProviderToken,
                  gmail_token_obtained_at: new Date().toISOString(),
                  gmail_connected_until: oneMonthLater.toISOString(),
                })
                .eq("id", sessionData.session.user.id);

              setGoogleAccessToken(finalProviderToken);
              setGoogleUserEmail(sessionData.session.user.email || null);
              setIsGoogleConnected(true);
              return finalProviderToken;
            }
          }
        }
      }
      return null;
    } catch (err: any) {
      showConfirm({
        title: "Gagal Otorisasi Gmail",
        message: err.message || "Gagal mengambil akses Gmail.",
        confirmText: "Tutup",
        cancelText: "",
        variant: "terracotta",
        iconType: "danger",
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [showConfirm]);

  const disconnectGoogle = useCallback(async () => {
    await clearStoredToken();
  }, []);

  const ensureFreshToken = useCallback(async (): Promise<string | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("gmail_access_token, gmail_connected_until")
        .eq("id", session.user.id)
        .single();

      if (!profile?.gmail_access_token || !profile?.gmail_connected_until) {
        return connectGoogle();
      }

      const connectedUntil = new Date(profile.gmail_connected_until).getTime();
      if (Date.now() > connectedUntil) {
        await clearStoredToken(session.user.id);
        return connectGoogle();
      }

      return profile.gmail_access_token;
    } catch {
      return googleAccessToken;
    }
  }, [googleAccessToken, connectGoogle]);

  return (
    <GoogleAuthContext.Provider
      value={{
        isGoogleConnected,
        googleAccessToken,
        googleUserEmail,
        isConnecting,
        connectGoogle,
        disconnectGoogle,
        ensureFreshToken,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx)
    throw new Error("useGoogleAuth must be used inside <GoogleAuthProvider>");
  return ctx;
}
