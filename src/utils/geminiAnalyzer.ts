import { isSupabaseConfigured, supabase } from "../lib/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/vokal-analyze`;

export type GeminiAnalysisFlag = {
  id: string;
  label: string;
  description: string;
  level: "danger" | "warning" | "info";
};

export type GeminiAnalysisResult = {
  score: number;
  verdict: string;
  summary: string;
  flags: GeminiAnalysisFlag[];
  isGemini: true;
};

type TextAnalysisParams = {
  type: "text";
  content: string;
  analysisType?: "email" | "message";
};

type VoiceAnalysisParams = {
  type: "voice";
  dspFeatures: {
    rhythmicRegularity: number;
    prosodyVariance: number;
    naturalPauseScore: number;
    microTremorScore: number;
    spectralFlatness: number;
    urgencyScore: number;
  };
};

type AnalysisParams = TextAnalysisParams | VoiceAnalysisParams;

export async function analyzeWithGemini(
  params: AnalysisParams,
): Promise<GeminiAnalysisResult> {
  if (!isSupabaseConfigured() || !SUPABASE_URL) {
    throw new Error("Supabase belum dikonfigurasi.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  } else {
    headers["Authorization"] = `Bearer ${anonKey}`;
  }

  const body =
    params.type === "text"
      ? {
          type: "text",
          content: params.content,
          analysisType: params.analysisType || "message",
        }
      : { type: "voice", dspFeatures: params.dspFeatures };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Edge Function error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      score: data.score ?? 0,
      verdict: data.verdict ?? "TIDAK DIKETAHUI",
      summary: data.summary ?? "",
      flags: data.flags ?? [],
      isGemini: true,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Analisis Gemini timeout. Periksa koneksi internet dan coba lagi.",
      );
    }
    throw err;
  }
}

export async function safeAnalyzeWithGemini(
  params: AnalysisParams,
): Promise<GeminiAnalysisResult | null> {
  try {
    return await analyzeWithGemini(params);
  } catch {
    return null;
  }
}
