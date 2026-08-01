import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type ScamReport = {
  id: string;
  phoneHash: string; // Hashed to preserve privacy (GetContact-style)
  phonePrefix: string; // e.g., "+62 858-xxx"
  type: string;
  location: string;
  timestamp: number;
};

export type BlockedCall = {
  id: string;
  date: string;
  reason: string;
};

type ScamContextType = {
  localScams: ScamReport[];
  myReports: ScamReport[];
  blockedCalls: BlockedCall[];
  reportScam: (phoneNumber: string, type: string, location: string) => Promise<void>;
  checkNumber: (phoneNumber: string) => Promise<boolean>;
  addBlockedCall: (reason: string) => Promise<void>;
  clearData: () => Promise<void>; // For demo purposes
};

const ScamContext = createContext<ScamContextType | undefined>(undefined);

const SCAM_DATA_KEY = '@vokal_scam_data_v1';
const BLOCKED_CALLS_KEY = '@vokal_blocked_calls_v1';

export function ScamProvider({ children }: { children: ReactNode }) {
  const [localScams, setLocalScams] = useState<ScamReport[]>([]);
  const [myReports, setMyReports] = useState<ScamReport[]>([]);
  const [blockedCalls, setBlockedCalls] = useState<BlockedCall[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedScams = await AsyncStorage.getItem(SCAM_DATA_KEY);
      const storedBlocked = await AsyncStorage.getItem(BLOCKED_CALLS_KEY);
      
      if (storedScams) {
        const parsed = JSON.parse(storedScams);
        setLocalScams(parsed);
        setMyReports(parsed); // In this local demo, my reports are the crowdsourced pool
      } else {
        // Initial Empty State (As requested: REAL data, NO mock starting data)
        setLocalScams([]);
        setMyReports([]);
      }

      if (storedBlocked) {
        setBlockedCalls(JSON.parse(storedBlocked));
      } else {
        setBlockedCalls([]);
      }
    } catch (e) {
      console.error("Failed to load scam data", e);
    }
  };

  const reportScam = async (phoneNumber: string, type: string, location: string) => {
    try {
      // 1. Hash the phone number for privacy
      const phoneHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        phoneNumber.replace(/\s+/g, '') // Remove spaces before hashing
      );

      // 2. Extract prefix for display
      const prefix = phoneNumber.substring(0, 6) + '-xxx';

      const newReport: ScamReport = {
        id: Math.random().toString(36).substring(7),
        phoneHash,
        phonePrefix: prefix,
        type,
        location,
        timestamp: Date.now(),
      };

      const updatedScams = [newReport, ...localScams];
      
      setLocalScams(updatedScams);
      setMyReports(updatedScams); // Simulate network effect locally
      
      await AsyncStorage.setItem(SCAM_DATA_KEY, JSON.stringify(updatedScams));
    } catch (e) {
      console.error("Failed to save scam report", e);
    }
  };

  const checkNumber = async (phoneNumber: string): Promise<boolean> => {
    const hashToCheck = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      phoneNumber.replace(/\s+/g, '')
    );
    
    return localScams.some(report => report.phoneHash === hashToCheck);
  };

  const addBlockedCall = async (reason: string) => {
    try {
      const newBlocked: BlockedCall = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toLocaleDateString('id-ID'),
        reason
      };
      const updated = [newBlocked, ...blockedCalls];
      setBlockedCalls(updated);
      await AsyncStorage.setItem(BLOCKED_CALLS_KEY, JSON.stringify(updated));
    } catch(e) {
      console.error("Failed to save blocked call", e);
    }
  };

  const clearData = async () => {
    await AsyncStorage.removeItem(SCAM_DATA_KEY);
    await AsyncStorage.removeItem(BLOCKED_CALLS_KEY);
    setLocalScams([]);
    setMyReports([]);
    setBlockedCalls([]);
  };

  return (
    <ScamContext.Provider value={{ localScams, myReports, blockedCalls, reportScam, checkNumber, addBlockedCall, clearData }}>
      {children}
    </ScamContext.Provider>
  );
}

export function useScamContext() {
  const context = useContext(ScamContext);
  if (context === undefined) {
    throw new Error('useScamContext must be used within a ScamProvider');
  }
  return context;
}
