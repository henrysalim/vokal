import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCK_USER, LEADERBOARD, LEVELS } from '../data/mock';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
};

type UserContextType = {
  xp: number;
  level: number;
  levelName: string;
  lives: number;
  leaderboard: LeaderboardEntry[];
  codeword: { word: string; expiresInHours: number; hash: string };
  familySecret: string;
  addXP: (amount: number) => void;
  reduceLife: () => void;
  resetLives: () => void;
  updateFamilySecret: (secret: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(MOCK_USER.xp);
  const [lives, setLives] = useState(3);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(LEADERBOARD);
  const [codeword, setCodeword] = useState({ word: 'MEMUAT...', expiresInHours: 6, hash: '0x00000000' });
  const [familySecret, setFamilySecret] = useState("VOKAL_SEC_SANTOSO_99X");

  // Sync Supabase user profile & family secret if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase
            .from('profiles')
            .select('name, xp, family_id, families(family_secret)')
            .eq('id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                if (data.xp) setXp(data.xp);
                if (data.name) {
                  const familyName = `Keluarga ${data.name.split(' ')[0]}`;
                  setLeaderboard(prev => prev.map(e => e.isMe ? { ...e, name: familyName } : e));
                }
                if (data.families && (data.families as any).family_secret) {
                  setFamilySecret((data.families as any).family_secret);
                }
              }
            });
        }
      });
    }
  }, []);

  useEffect(() => {
    // Generate TOTP codeword saat aplikasi dibuka atau familySecret berubah
    import('../utils/totp').then(({ generateCodeword }) => {
      generateCodeword(familySecret, 6).then(result => {
        setCodeword({ word: result.codeword, expiresInHours: result.expiresInHours, hash: result.hashHex });
      });
    });
  }, [familySecret]);

  // Derive level from XP based on LEVELS array
  const currentLevelInfo = LEVELS.slice().reverse().find(l => xp >= l.minXP) || LEVELS[0];
  const level = currentLevelInfo.id;
  const levelName = currentLevelInfo.name;

  // Whenever XP changes, update leaderboard
  useEffect(() => {
    setLeaderboard(prev => {
      const updated = prev.map(entry => {
        if (entry.isMe) {
          return { ...entry, score: xp };
        }
        return entry;
      });
      
      // Sort by score descending
      updated.sort((a, b) => b.score - a.score);
      
      // Re-assign ranks
      return updated.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    });
  }, [xp]);

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

  const reduceLife = () => {
    setLives(prev => Math.max(0, prev - 1));
  };

  const resetLives = () => {
    setLives(3);
  };

  const updateFamilySecret = async (secret: string) => {
    const cleanSecret = secret.trim();
    if (cleanSecret.length > 0) {
      setFamilySecret(cleanSecret);

      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if family already exists for this secret or create one
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
        }
      }
    }
  };

  return (
    <UserContext.Provider value={{ xp, level, levelName, lives, leaderboard, codeword, familySecret, addXP, reduceLife, resetLives, updateFamilySecret }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
