import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCK_USER, LEADERBOARD, LEVELS } from '../data/mock';

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
  codeword: { word: string; expiresInHours: number };
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
  const [codeword, setCodeword] = useState({ word: 'MEMUAT...', expiresInHours: 6 });
  const [familySecret, setFamilySecret] = useState("VOKAL_SEC_SANTOSO_99X");

  useEffect(() => {
    // Generate TOTP codeword saat aplikasi dibuka atau familySecret berubah
    import('../utils/totp').then(({ generateCodeword }) => {
      generateCodeword(familySecret, 6).then(result => {
        setCodeword({ word: result.codeword, expiresInHours: result.expiresInHours });
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
    setXp(prev => prev + amount);
  };

  const reduceLife = () => {
    setLives(prev => Math.max(0, prev - 1));
  };

  const resetLives = () => {
    setLives(3);
  };

  const updateFamilySecret = (secret: string) => {
    if(secret.trim().length > 0) {
      setFamilySecret(secret);
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
