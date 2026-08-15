import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnalysisHistoryItem = {
  id: string;
  type: "suara" | "email" | "pesan" | "nomor";
  title: string;
  detail: string;
  status: "aman" | "waspada" | "bahaya";
  timestamp: number;
};

const HISTORY_KEY = "@vokal_analysis_history";

const DEFAULT_LOGS: AnalysisHistoryItem[] = [
  {
    id: "default_1",
    type: "suara",
    title: "Cek Suara: Panggilan Telepon Masuk",
    detail: "Pola suara natural terdeteksi (98% Aman). Bukan suara sintetis.",
    status: "aman",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: "default_2",
    type: "pesan",
    title: "Cek Pesan: Chat Hadiah WhatsApp",
    detail: "Terdeteksi pola SMS/WA Phishing undian palsu (85% Waspada!).",
    status: "bahaya",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  }
];

export async function getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOGS;
  }
}

export async function addAnalysisLog(
  type: "suara" | "email" | "pesan" | "nomor",
  title: string,
  detail: string,
  status: "aman" | "waspada" | "bahaya"
) {
  try {
    const history = await getAnalysisHistory();
    const newLog: AnalysisHistoryItem = {
      id: Math.random().toString(36).substring(7),
      type,
      title,
      detail,
      status,
      timestamp: Date.now(),
    };
    const updated = [newLog, ...history];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to add analysis log", e);
  }
}
