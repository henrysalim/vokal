import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVELS } from '../data/mock';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  initials: string;
  isMe: boolean;
};

// 5 minutes in ms
const LIVES_COOLDOWN_MS = 5 * 60 * 1000;

type UserContextType = {
  xp: number;
  level: number;
  levelName: string;
  xpNextLevel: number;
  lives: number;
  livesRefillAt: number | null; // timestamp ms when lives will refill
  livesSecondsLeft: number;     // countdown seconds
  completedModuleIds: string[];
  leaderboard: LeaderboardEntry[];
  isLoadingLeaderboard: boolean;
  codeword: { word: string; expiresInHours: number; hash: string };
  familySecret: string;
  addXP: (amount: number) => void;
  reduceLife: () => void;
  resetLives: () => void;
  markModuleComplete: (moduleId: string) => void;
  updateFamilySecret: (secret: string) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(3);
  const [livesRefillAt, setLivesRefillAt] = useState<number | null>(null);
  const [livesSecondsLeft, setLivesSecondsLeft] = useState(0);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [codeword, setCodeword] = useState({ word: 'MEMUAT...', expiresInHours: 6, hash: '0x00000000' });
  const [familySecret, setFamilySecret] = useState('VOKAL_DEFAULT_SECRET');

  // ──────────────────────────────────────────────────────────
  // Load profile data on auth state change
  // ──────────────────────────────────────────────────────────
  const loadProfile = async (userId: string) => {
    let localXp = 0;

    // 1. Load cached XP & completed modules from AsyncStorage first
    try {
      const cachedXp = await AsyncStorage.getItem(`vokal_xp_${userId}`);
      if (cachedXp !== null) {
        localXp = parseInt(cachedXp, 10) || 0;
        setXp(localXp);
      }

      const cachedModules = await AsyncStorage.getItem(`vokal_completed_modules_${userId}`);
      if (cachedModules) {
        const parsed = JSON.parse(cachedModules);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompletedModuleIds(parsed);
        }
      }
    } catch {
      // silent fallback
    }

    if (!isSupabaseConfigured()) return;

    // 2. Fetch from Supabase
    const { data } = await supabase
      .from('profiles')
      .select('xp, completed_module_ids, lives, lives_refill_at, family_id, family_secret')
      .eq('id', userId)
      .single();

    if (!data) return;

    // Merge XP: take higher of local cache or Supabase to prevent regression
    const dbXp = typeof data.xp === 'number' ? data.xp : 0;
    const maxXp = Math.max(localXp, dbXp);
    setXp(maxXp);
    AsyncStorage.setItem(`vokal_xp_${userId}`, maxXp.toString()).catch(() => {});

    if (maxXp > dbXp) {
      supabase.from('profiles').update({ xp: maxXp }).eq('id', userId);
    }

    // Completed modules: merge Supabase & local cache
    if (Array.isArray(data.completed_module_ids)) {
      setCompletedModuleIds(prev => {
        const merged = Array.from(new Set([...prev, ...data.completed_module_ids]));
        AsyncStorage.setItem(`vokal_completed_modules_${userId}`, JSON.stringify(merged)).catch(() => {});
        return merged;
      });
    }

    // Lives with cooldown check
    const refillAt: number | null = data.lives_refill_at ? new Date(data.lives_refill_at).getTime() : null;
    const storedLives: number = typeof data.lives === 'number' ? data.lives : 3;

    if (refillAt && Date.now() >= refillAt && storedLives === 0) {
      setLives(3);
      setLivesRefillAt(null);
      await supabase.from('profiles').update({ lives: 3, lives_refill_at: null }).eq('id', userId);
    } else {
      setLives(storedLives);
      setLivesRefillAt(refillAt);
    }

    // Family secret
    if (data.family_secret) setFamilySecret(data.family_secret);
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
        refreshLeaderboard();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
        refreshLeaderboard();
      } else {
        // Reset on logout
        setXp(0);
        setLives(3);
        setLivesRefillAt(null);
        setCompletedModuleIds([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ──────────────────────────────────────────────────────────
  // Countdown timer for lives refill
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!livesRefillAt || lives > 0) {
      setLivesSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((livesRefillAt - Date.now()) / 1000));
      setLivesSecondsLeft(remaining);

      if (remaining <= 0) {
        // Restore lives when cooldown ends
        setLives(3);
        setLivesRefillAt(null);
        // Persist to Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('profiles').update({ lives: 3, lives_refill_at: null }).eq('id', session.user.id);
          }
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [livesRefillAt, lives]);

  // ──────────────────────────────────────────────────────────
  // Codeword generation
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    import('../utils/totp').then(({ generateCodeword }) => {
      generateCodeword(familySecret, 6).then(result => {
        setCodeword({ word: result.codeword, expiresInHours: result.expiresInHours, hash: result.hashHex });
      });
    });
  }, [familySecret]);

  // ──────────────────────────────────────────────────────────
  // Leaderboard
  // ──────────────────────────────────────────────────────────
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
          score: typeof p.xp === 'number' ? p.xp : 0,
          initials: p.avatar_initials || (p.name ? p.name.substring(0, 2).toUpperCase() : 'VK'),
          isMe: p.id === myId,
        }));
        setLeaderboard(entries);
      } else {
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
      // silently fail
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Level computation
  // ──────────────────────────────────────────────────────────
  const currentLevelInfo = LEVELS.slice().reverse().find(l => xp >= l.minXP) || LEVELS[0];
  const level = currentLevelInfo.id;
  const levelName = currentLevelInfo.name;
  const nextLevelObj = LEVELS.find(l => l.minXP > xp) || { minXP: 3000 };
  const xpNextLevel = nextLevelObj.minXP;

  // ──────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────
  const addXP = (amount: number) => {
    if (amount <= 0) return;
    setXp(prev => {
      const newXp = prev + amount;

      // 1. Save to AsyncStorage
      supabase.auth.getSession().then(({ data: { session } }) => {
        const userId = session?.user?.id;
        if (userId) {
          AsyncStorage.setItem(`vokal_xp_${userId}`, newXp.toString()).catch(() => {});
          if (isSupabaseConfigured()) {
            supabase.from('profiles').update({ xp: newXp }).eq('id', userId).then(() => {
              refreshLeaderboard();
            });
          }
        }
      });

      return newXp;
    });
  };

  const reduceLife = () => {
    setLives(prev => {
      const newLives = Math.max(0, prev - 1);
      const newRefillAt = newLives === 0 ? Date.now() + LIVES_COOLDOWN_MS : null;

      if (newLives === 0) setLivesRefillAt(newRefillAt);

      if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('profiles').update({
              lives: newLives,
              lives_refill_at: newRefillAt ? new Date(newRefillAt).toISOString() : null,
            }).eq('id', session.user.id);
          }
        });
      }
      return newLives;
    });
  };

  const resetLives = () => {
    setLives(3);
    setLivesRefillAt(null);
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase.from('profiles').update({ lives: 3, lives_refill_at: null }).eq('id', session.user.id);
        }
      });
    }
  };

  const markModuleComplete = (moduleId: string) => {
    if (!moduleId) return;
    setCompletedModuleIds(prev => {
      if (prev.includes(moduleId)) return prev;
      const updated = [...prev, moduleId];

      supabase.auth.getSession().then(({ data: { session } }) => {
        const userId = session?.user?.id;
        if (userId) {
          AsyncStorage.setItem(`vokal_completed_modules_${userId}`, JSON.stringify(updated)).catch(() => {});
        }
        if (isSupabaseConfigured() && session?.user) {
          supabase.from('profiles').update({ completed_module_ids: updated }).eq('id', session.user.id);
        }
      });

      return updated;
    });
  };

  const updateFamilySecret = async (secret: string) => {
    const cleanSecret = secret.trim();
    if (cleanSecret.length === 0) return;
    setFamilySecret(cleanSecret);

    if (!isSupabaseConfigured()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // 1. Cari profile lain yang mempunyai family_secret yang sama
    const { data: otherProfiles } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("family_secret", cleanSecret)
      .not("family_id", "is", null)
      .limit(1);

    let targetFamilyId = otherProfiles && otherProfiles.length > 0 ? otherProfiles[0].family_id : null;

    if (!targetFamilyId) {
      targetFamilyId = "fam_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    }

    // 2. Update profiles untuk user saat ini dengan family_id dan family_secret baru
    await supabase
      .from("profiles")
      .update({
        family_id: targetFamilyId,
        family_secret: cleanSecret
      })
      .eq("id", session.user.id);
  };

  return (
    <UserContext.Provider value={{
      xp, level, levelName, xpNextLevel, lives, livesRefillAt, livesSecondsLeft,
      completedModuleIds,
      leaderboard, isLoadingLeaderboard,
      codeword, familySecret,
      addXP, reduceLife, resetLives, markModuleComplete,
      updateFamilySecret, refreshLeaderboard,
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
