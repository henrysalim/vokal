import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LEVELS } from '../data/mock';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  initials: string;
  isMe: boolean;
};

type UserContextType = {
  xp: number;
  level: number;
  levelName: string;
  lives: number;
  leaderboard: LeaderboardEntry[];
  isLoadingLeaderboard: boolean;
  codeword: { word: string; expiresInHours: number; hash: string };
  familySecret: string;
  addXP: (amount: number) => void;
  reduceLife: () => void;
  resetLives: () => void;
  updateFamilySecret: (secret: string) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(3);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [codeword, setCodeword] = useState({ word: 'MEMUAT...', expiresInHours: 6, hash: '0x00000000' });
  const [familySecret, setFamilySecret] = useState('VOKAL_DEFAULT_SECRET');

  // ─── Load from Supabase on mount ────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;

      // Load this user's XP and family secret
      supabase
        .from('profiles')
        .select('xp, family_id, families(family_secret)')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            if (typeof data.xp === 'number') setXp(data.xp);
            const famAny = data.families as any;
            if (famAny?.family_secret) {
              setFamilySecret(famAny.family_secret);
            }
          }
        });

      refreshLeaderboard();
    });

    // Listen for auth changes (e.g., after login)
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('xp, family_id, families(family_secret)')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              if (typeof data.xp === 'number') setXp(data.xp);
              const famAny = data.families as any;
              if (famAny?.family_secret) setFamilySecret(famAny.family_secret);
            }
          });
        refreshLeaderboard();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ─── Generate TOTP codeword whenever familySecret changes ───────
  useEffect(() => {
    import('../utils/totp').then(({ generateCodeword }) => {
      generateCodeword(familySecret, 6).then(result => {
        setCodeword({ word: result.codeword, expiresInHours: result.expiresInHours, hash: result.hashHex });
      });
    });
  }, [familySecret]);

  // ─── Real leaderboard from Supabase ─────────────────────────────
  const refreshLeaderboard = async () => {
    if (!isSupabaseConfigured()) return;
    setIsLoadingLeaderboard(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const myId = session?.user?.id;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, xp, avatar_initials')
        .order('xp', { ascending: false })
        .limit(10);

      if (profiles && profiles.length > 0) {
        const entries: LeaderboardEntry[] = profiles.map((p: any, idx: number) => ({
          rank: idx + 1,
          name: p.name || 'Pengguna VOKAL',
          score: p.xp || 0,
          initials: p.avatar_initials || (p.name ? p.name.substring(0, 2).toUpperCase() : 'VK'),
          isMe: p.id === myId,
        }));
        setLeaderboard(entries);
      } else {
        // If no data yet, just show current user
        if (myId) {
          const { data: me } = await supabase.from('profiles').select('name, xp, avatar_initials').eq('id', myId).single();
          if (me) {
            setLeaderboard([{
              rank: 1,
              name: me.name || 'Pengguna VOKAL',
              score: me.xp || xp,
              initials: me.avatar_initials || 'VK',
              isMe: true,
            }]);
          }
        }
      }
    } catch {
      // silently fail — leaderboard just stays empty
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // ─── Derive level from XP ────────────────────────────────────────
  const currentLevelInfo = LEVELS.slice().reverse().find(l => xp >= l.minXP) || LEVELS[0];
  const level = currentLevelInfo.id;
  const levelName = currentLevelInfo.name;

  // ─── addXP — updates local state and persists to Supabase ───────
  const addXP = (amount: number) => {
    setXp(prev => {
      const newXp = prev + amount;
      if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('profiles').update({ xp: newXp }).eq('id', session.user.id);
          }
        });
      }
      return newXp;
    });
  };

  const reduceLife = () => setLives(prev => Math.max(0, prev - 1));
  const resetLives = () => setLives(3);

  const updateFamilySecret = async (secret: string) => {
    const cleanSecret = secret.trim();
    if (cleanSecret.length === 0) return;
    setFamilySecret(cleanSecret);

    if (!isSupabaseConfigured()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Find or create family with this secret
    let { data: existingFam } = await supabase
      .from('families')
      .select('id')
      .eq('family_secret', cleanSecret)
      .single();

    if (!existingFam) {
      const { data: newFam } = await supabase
        .from('families')
        .insert([{ name: 'Keluarga VOKAL', family_secret: cleanSecret }])
        .select('id')
        .single();
      existingFam = newFam;
    }

    if (existingFam) {
      await supabase
        .from('profiles')
        .update({ family_id: existingFam.id })
        .eq('id', session.user.id);
    }
  };

  return (
    <UserContext.Provider value={{
      xp, level, levelName, lives, leaderboard, isLoadingLeaderboard,
      codeword, familySecret,
      addXP, reduceLife, resetLives, updateFamilySecret, refreshLeaderboard,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
}
