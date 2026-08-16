import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildTextPrompt(text: string, analysisType: string): string {
  const ctx =
    analysisType === "email"
      ? "email yang diterima pengguna"
      : "pesan WhatsApp, SMS, atau chat";
  return `Kamu adalah sistem deteksi penipuan digital Indonesia yang canggih. Analisis ${ctx} berikut ini.

TEKS:
---
${text.substring(0, 4000)}
---

Kembalikan HANYA JSON (tanpa markdown):
{
  "score": <0-100, 0=aman, 100=berbahaya>,
  "verdict": <"AMAN" | "WASPADA" | "BERBAHAYA">,
  "summary": <ringkasan 1-2 kalimat Bahasa Indonesia>,
  "flags": [{"id":"string","label":"judul pendek","description":"penjelasan Bahasa Indonesia","level":"danger"|"warning"|"info"}]
}

PANDUAN: 0-19=aman, 20-49=waspada, 50+=berbahaya.
Deteksi: link palsu, permintaan OTP/PIN, ancaman/urgensi, hadiah palsu, impersonasi instansi, transfer uang, kata manipulatif.
Jika aman, kembalikan flags=[] dan score 0-15.`;
}

function buildVoicePrompt(features: Record<string, number>): string {
  return `Kamu adalah sistem deteksi kloning suara AI. Analisis fitur audio berikut.

FITUR DSP:
- Rhythmic Regularity: ${features.rhythmicRegularity ?? 50}% (tinggi=teratur=AI)
- Prosody Variance: ${features.prosodyVariance ?? 50}% (rendah=flat=AI)  
- Natural Pause Score: ${features.naturalPauseScore ?? 50}% (rendah=tidak ada jeda=AI)
- Micro-Tremor Score: ${features.microTremorScore ?? 50}% (rendah=tidak ada tremor=AI)
- Spectral Flatness: ${features.spectralFlatness ?? 50}% (tinggi=sintetis=AI)
- Skor DSP Lokal: ${features.urgencyScore ?? 20}%

Kembalikan HANYA JSON (tanpa markdown):
{
  "score": <0-100, 0=manusia asli, 100=pasti AI>,
  "verdict": <"SUARA ASLI" | "PERLU VERIFIKASI" | "TERINDIKASI AI">,
  "summary": <penjelasan 2-3 kalimat Bahasa Indonesia>,
  "flags": [{"id":"string","label":"string","description":"string","level":"danger"|"warning"|"info"}]
}`;
}

function safeParse(text: string) {
  const cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const p = JSON.parse(match[0]);
    return {
      score: Math.max(0, Math.min(100, Number(p.score) || 0)),
      verdict: p.verdict || "TIDAK DIKETAHUI",
      summary: p.summary || "Tidak ada ringkasan.",
      flags: Array.isArray(p.flags) ? p.flags.slice(0, 10) : [],
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: CORS_HEADERS });

  if (req.method === "GET") {
    const isKeyConfigured = !!GEMINI_API_KEY;
    return new Response(
      JSON.stringify({
        status: "online",
        message: "VOKAL Gemini API Proxy is running!",
        gemini_key_configured: isKeyConfigured,
      }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  }

  try {
    const { type, content, dspFeatures, analysisType } = await req.json();
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY tidak dikonfigurasi.");

    console.log(`Analyzing type: ${type}`);
    const prompt =
      type === "voice"
        ? buildVoicePrompt(dspFeatures || {})
        : buildTextPrompt(content || "", analysisType || "message");

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
    });

    const data = await res.json();
    console.log("Gemini raw response data:", JSON.stringify(data));

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini raw text parts:", rawText);

    const result = safeParse(rawText) ?? {
      score: 30,
      verdict: "PERLU VERIFIKASI",
      summary: "Analisis tidak dapat diselesaikan. Harap verifikasi manual.",
      flags: [
        {
          id: "err",
          label: "Analisis Gagal",
          description: "Coba lagi atau verifikasi secara manual.",
          level: "warning",
        },
      ],
    };

    console.log("Final parsed result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Edge Function processing error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
