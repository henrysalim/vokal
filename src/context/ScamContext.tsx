import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

export type CheckResult = {
  isScam: boolean;
  matchedReport?: ScamReport;
  totalReports: number;
};

type ScamContextType = {
  localScams: ScamReport[];
  myReports: ScamReport[];
  blockedCalls: BlockedCall[];
  reportScam: (phoneNumber: string, type: string, location: string) => Promise<void>;
  checkNumber: (phoneNumber: string) => Promise<boolean>;
  checkNumberDetails: (phoneNumber: string) => Promise<CheckResult>;
  addBlockedCall: (reason: string) => Promise<void>;
  clearData: () => Promise<void>;
};

const ScamContext = createContext<ScamContextType | undefined>(undefined);

const SCAM_DATA_KEY = '@vokal_scam_data_v1';
const BLOCKED_CALLS_KEY = '@vokal_blocked_calls_v1';

export function ScamProvider({ children }: { children: ReactNode }) {
  const [localScams, setLocalScams] = useState<ScamReport[]>([]);
  const [myReports, setMyReports] = useState<ScamReport[]>([]);
  const [blockedCalls, setBlockedCalls] = useState<BlockedCall[]>([]);

  // Load from Supabase DB or fallback to AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data: dbScams, error: scamErr } = await supabase
          .from('scam_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!scamErr && dbScams) {
          const mappedScams: ScamReport[] = dbScams.map((item: any) => ({
            id: item.id,
            phoneHash: item.phone_hash,
            phonePrefix: item.phone_prefix,
            type: item.type,
            location: item.location,
            timestamp: new Date(item.created_at).getTime(),
          }));
          setLocalScams(mappedScams);
          setMyReports(mappedScams);
        }

        const { data: dbBlocked, error: blockedErr } = await supabase
          .from('blocked_calls')
          .select('*')
          .order('created_at', { ascending: false });

        if (!blockedErr && dbBlocked) {
          const mappedBlocked: BlockedCall[] = dbBlocked.map((item: any) => ({
            id: item.id,
            date: item.date_str,
            reason: item.reason,
          }));
          setBlockedCalls(mappedBlocked);
        }
      } else {
        // Fallback to AsyncStorage
        const storedScams = await AsyncStorage.getItem(SCAM_DATA_KEY);
        const storedBlocked = await AsyncStorage.getItem(BLOCKED_CALLS_KEY);

        if (storedScams) {
          const parsed = JSON.parse(storedScams);
          setLocalScams(parsed);
          setMyReports(parsed);
        }

        if (storedBlocked) {
          setBlockedCalls(JSON.parse(storedBlocked));
        }
      }
    } catch (e) {
      console.error("Failed to load scam data", e);
    }
  };

  const reportScam = async (phoneNumber: string, type: string, location: string) => {
    try {
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      const phoneHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        cleanPhone
      );

      const prefix = cleanPhone.length > 6 ? cleanPhone.substring(0, 6) + '-xxx' : cleanPhone + '-xxx';

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
      setMyReports(updatedScams);

      await AsyncStorage.setItem(SCAM_DATA_KEY, JSON.stringify(updatedScams));

      if (isSupabaseConfigured()) {
        await supabase.from('scam_reports').insert([{
          phone_hash: phoneHash,
          phone_prefix: prefix,
          type,
          location,
        }]);
      }
    } catch (e) {
      console.error("Failed to save scam report", e);
    }
  };

  const checkNumberDetails = async (phoneNumber: string): Promise<CheckResult> => {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const hashToCheck = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      cleanPhone
    );

    // Try DB match if configured
    let matchedReports = localScams.filter(report => report.phoneHash === hashToCheck);

    if (isSupabaseConfigured() && matchedReports.length === 0) {
      const { data } = await supabase
        .from('scam_reports')
        .select('*')
        .eq('phone_hash', hashToCheck);

      if (data && data.length > 0) {
        matchedReports = data.map((item: any) => ({
          id: item.id,
          phoneHash: item.phone_hash,
          phonePrefix: item.phone_prefix,
          type: item.type,
          location: item.location,
          timestamp: new Date(item.created_at).getTime(),
        }));
      }
    }

    return {
      isScam: matchedReports.length > 0,
      matchedReport: matchedReports[0],
      totalReports: matchedReports.length,
    };
  };

  const checkNumber = async (phoneNumber: string): Promise<boolean> => {
    const result = await checkNumberDetails(phoneNumber);
    return result.isScam;
  };

  const addBlockedCall = async (reason: string) => {
    try {
      const dateStr = new Date().toLocaleDateString('id-ID');
      const newBlocked: BlockedCall = {
        id: Math.random().toString(36).substring(7),
        date: dateStr,
        reason,
      };

      const updated = [newBlocked, ...blockedCalls];
      setBlockedCalls(updated);
      await AsyncStorage.setItem(BLOCKED_CALLS_KEY, JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          let userFamilyId = null;
          if (session?.user) {
            const { data: prof } = await supabase.from('profiles').select('family_id').eq('id', session.user.id).single();
            if (prof?.family_id) userFamilyId = prof.family_id;
          }

          const payload: any = {
            reason,
            date_str: dateStr,
          };
          if (userFamilyId) payload.family_id = userFamilyId;

          const { error: insErr } = await supabase.from('blocked_calls').insert([payload]);
          if (insErr) {
            console.warn("Blocked call DB insert warning:", insErr.message);
          }
        } catch (dbErr) {
          console.warn("Blocked call DB exception:", dbErr);
        }
      }
    } catch (e) {
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
    <ScamContext.Provider value={{
      localScams,
      myReports,
      blockedCalls,
      reportScam,
      checkNumber,
      checkNumberDetails,
      addBlockedCall,
      clearData
    }}>
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
