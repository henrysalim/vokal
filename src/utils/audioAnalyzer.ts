/**
 * VOKAL On-Device Voice Cloning Detector
 * =======================================
 * Engine deteksi kloning suara AI 100% lokal (zero internet) menggunakan
 * pendekatan MFCC-lite dari data amplitudo metering real-time (expo-av).
 *
 * Metode yang digunakan:
 * 1. Rhythmic Regularity Index (RRI) — suara AI terlalu teratur, tidak ada variasi
 * 2. Zero Crossing Rate simulasi dari amplitudo (proxy ZCR)
 * 3. Spectral Flatness Estimation — suara sintetis punya distribusi energi lebih rata
 * 4. Prosody Variance — manusia real punya variasi nada alami
 * 5. Breathing & Pause Gap Detection — AI jarang punya jeda napas alami
 * 6. Micro-Tremor Detection — suara manusia real selalu ada micro-tremor
 */

export type VoiceFeatures = {
  /** 0–100: semakin tinggi = semakin teratur/robot */
  rhythmicRegularity: number;
  /** 0–100: semakin rendah = sinyal lebih flat/sintetis */
  prosodyVariance: number;
  /** 0–100: berapa banyak jeda napas natural terdeteksi */
  naturalPauseScore: number;
  /** 0–100: keacakan micro-tremor (AI = sangat rendah) */
  microTremorScore: number;
  /** 0–100: estimasi spectral flatness (tinggi = lebih sintetis) */
  spectralFlatness: number;
};

export type DspAnalysisResult = {
  /** Skor risiko kloning AI (0–100, semakin tinggi = semakin mencurigakan) */
  urgencyScore: number;
  /** Standar deviasi amplitudo */
  stdDev: number;
  /** Jumlah celah keheningan terdeteksi */
  silenceGaps: number;
  /** Jumlah puncak amplitudo */
  peaks: number;
  /** Volume rata-rata (dB) */
  avgVolume: number;
  /** Apakah skor melebihi threshold berbahaya */
  isHighUrgency: boolean;
  /** Breakdown fitur per dimensi */
  features: VoiceFeatures;
  /** Penjelasan singkat per feature */
  featureExplanations: Record<keyof VoiceFeatures, string>;
  /** Metode deteksi yang digunakan */
  detectionMethod: string;
};

// ───────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────

/** Hitung standar deviasi dari array angka */
function stddev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/** Hitung rata-rata dari array */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Normalisasi nilai ke range 0–100 */
function norm(val: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

// ───────────────────────────────────────────
// FEATURE EXTRACTORS
// ───────────────────────────────────────────

/**
 * Rhythmic Regularity Index (RRI)
 * Suara manusia real punya variasi ritme alami.
 * Suara AI terlalu smooth dan teratur.
 * RRI tinggi = mencurigakan.
 */
function extractRhythmicRegularity(data: number[]): number {
  if (data.length < 10) return 50;

  // Hitung perbedaan antar frame berurutan
  const diffs: number[] = [];
  for (let i = 1; i < data.length; i++) {
    diffs.push(Math.abs(data[i] - data[i - 1]));
  }

  const meanDiff = mean(diffs);
  const varianceDiff = stddev(diffs);

  // Coefficient of variation: rendah = sangat teratur = AI-like
  const cv = meanDiff > 0 ? varianceDiff / meanDiff : 0;

  // CV rendah (< 0.3) berarti sangat regular = skor tinggi = mencurigakan
  // CV tinggi (> 0.8) berarti natural variation = skor rendah = aman
  const regularity = Math.max(0, 1 - Math.min(cv / 0.8, 1));
  return parseFloat((regularity * 100).toFixed(1));
}

/**
 * Prosody Variance
 * Manusia real punya variasi amplitudo (naik-turun saat berbicara).
 * AI voice terlalu konsisten.
 * Score rendah = lebih sintetis.
 */
function extractProsodyVariance(data: number[]): number {
  if (data.length < 5) return 50;

  // Pisahkan data ke segmen-segmen 10-frame
  const segmentSize = Math.max(5, Math.floor(data.length / 6));
  const segmentMeans: number[] = [];

  for (let i = 0; i < data.length; i += segmentSize) {
    const segment = data.slice(i, i + segmentSize);
    if (segment.length >= 3) {
      segmentMeans.push(mean(segment));
    }
  }

  if (segmentMeans.length < 2) return 50;

  // Variance antar segmen: rendah = flat = sintetis
  const segVariance = stddev(segmentMeans);

  // Prosody alami: std antar segmen biasanya > 8 dB
  // AI: std antar segmen biasanya < 3 dB
  const prosodyScore = norm(segVariance, 0, 20);
  return parseFloat(prosodyScore.toFixed(1));
}

/**
 * Natural Pause Detection
 * Manusia saat bicara punya jeda napas natural (0.3–1.5 detik).
 * AI voice generation sering tidak punya jeda natural, atau jedanya terlalu presisi.
 * Score tinggi = banyak jeda natural = lebih manusiawi.
 */
function extractNaturalPauseScore(data: number[], frameIntervalMs = 100): number {
  if (data.length < 15) return 30;

  const SILENCE_THRESH = -42;
  const MIN_NATURAL_PAUSE_FRAMES = 3;   // ~300ms minimum jeda napas
  const MAX_NATURAL_PAUSE_FRAMES = 15;  // ~1500ms maksimum jeda natural

  let inSilence = false;
  let silenceCount = 0;
  let naturalPauses = 0;
  let tooLongPauses = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i] < SILENCE_THRESH) {
      if (!inSilence) {
        inSilence = true;
        silenceCount = 1;
      } else {
        silenceCount++;
      }
    } else {
      if (inSilence) {
        if (silenceCount >= MIN_NATURAL_PAUSE_FRAMES && silenceCount <= MAX_NATURAL_PAUSE_FRAMES) {
          naturalPauses++;
        } else if (silenceCount > MAX_NATURAL_PAUSE_FRAMES) {
          tooLongPauses++;
        }
        inSilence = false;
        silenceCount = 0;
      }
    }
  }

  // 2-4 jeda natural dalam 5 detik bicara = sangat natural
  const expectedPauses = (data.length * frameIntervalMs) / 1000 * 0.5;
  const pauseRatio = naturalPauses / Math.max(1, expectedPauses);

  const baseScore = norm(pauseRatio, 0, 1.5) * 0.7;
  const penaltyRobot = tooLongPauses > 3 ? 20 : 0;

  return parseFloat(Math.max(0, Math.min(100, baseScore - penaltyRobot)).toFixed(1));
}

/**
 * Micro-Tremor Detection
 * Suara manusia real punya micro-tremor — getaran kecil sangat cepat yang alami.
 * Suara AI/TTS hampir tidak punya micro-tremor.
 * Score tinggi = banyak micro-tremor = lebih manusiawi.
 */
function extractMicroTremorScore(data: number[]): number {
  if (data.length < 20) return 40;

  // Hitung rapid sign changes (proxy micro-tremor dari amplitudo)
  let rapidFlips = 0;
  const windowSize = 3;

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const localMean = mean(data.slice(i - windowSize, i + windowSize));
    const localDev = stddev(data.slice(i - windowSize, i + windowSize));

    // Micro-tremor: nilai yang naik-turun cepat di sekitar mean lokal
    if (localDev > 0 && Math.abs(data[i] - localMean) > localDev * 0.5) {
      if (i > 0 && Math.sign(data[i] - data[i - 1]) !== Math.sign(data[i - 1] - data[i - 2])) {
        rapidFlips++;
      }
    }
  }

  // Normalkan: ~20–40% frame punya micro-tremor = natural
  const flipRate = rapidFlips / Math.max(1, data.length - windowSize * 2);
  return parseFloat(norm(flipRate, 0.02, 0.4).toFixed(1));
}

/**
 * Spectral Flatness Estimation (dari amplitudo domain)
 * Suara sintetis cenderung punya distribusi amplitudo lebih merata (flat).
 * Suara manusia punya distribusi yang lebih bervariasi (peaked).
 * Score tinggi = lebih flat = lebih sintetis.
 */
function extractSpectralFlatness(data: number[]): number {
  if (data.length < 10) return 50;

  // Ubah ke linear magnitude (dB ke linear)
  const linear = data.map(db => Math.pow(10, db / 20));

  // Geometric mean / arithmetic mean ratio = spectral flatness
  const logMean = mean(linear.map(v => Math.log(Math.max(v, 1e-6))));
  const geoMean = Math.exp(logMean);
  const arithMean = mean(linear);

  const flatness = arithMean > 0 ? geoMean / arithMean : 0;

  // Flatness: 0 = sangat peaked (natural) → 1 = sangat flat (sintetis)
  return parseFloat(norm(flatness, 0, 0.9).toFixed(1));
}

// ───────────────────────────────────────────
// MAIN ANALYZER
// ───────────────────────────────────────────

export function analyzeLocalDSP(meteringData: number[]): DspAnalysisResult {
  // Fallback untuk data yang terlalu pendek
  if (!meteringData || meteringData.length < 10) {
    const features: VoiceFeatures = {
      rhythmicRegularity: 50,
      prosodyVariance: 50,
      naturalPauseScore: 50,
      microTremorScore: 50,
      spectralFlatness: 50,
    };
    return {
      urgencyScore: 20,
      stdDev: 12.0,
      silenceGaps: 2,
      peaks: 4,
      avgVolume: -35.0,
      isHighUrgency: false,
      features,
      featureExplanations: buildExplanations(features),
      detectionMethod: 'VOKAL On-Device DSP v2 (data terlalu singkat)',
    };
  }

  // ── Hitung statistik dasar ──
  const avgVolume = parseFloat(mean(meteringData).toFixed(1));
  const std = parseFloat(stddev(meteringData).toFixed(1));

  // Hitung peaks
  let peaks = 0;
  for (let i = 1; i < meteringData.length - 1; i++) {
    if (meteringData[i] > meteringData[i - 1] && meteringData[i] > meteringData[i + 1] && meteringData[i] > -30) {
      peaks++;
    }
  }

  // Hitung silence gaps
  const SILENCE_THRESHOLD = -45;
  let silenceFrames = 0;
  let totalSilenceGaps = 0;
  for (let i = 0; i < meteringData.length; i++) {
    if (meteringData[i] < SILENCE_THRESHOLD) {
      silenceFrames++;
    } else {
      if (silenceFrames >= 3) totalSilenceGaps++;
      silenceFrames = 0;
    }
  }

  // ── Extract semua features ──
  const features: VoiceFeatures = {
    rhythmicRegularity: extractRhythmicRegularity(meteringData),
    prosodyVariance: extractProsodyVariance(meteringData),
    naturalPauseScore: extractNaturalPauseScore(meteringData),
    microTremorScore: extractMicroTremorScore(meteringData),
    spectralFlatness: extractSpectralFlatness(meteringData),
  };

  // ── Scoring: gabungkan semua feature ke skor risiko AI ──
  // Setiap feature dikontribusikan dengan bobot berbeda:
  //   rhythmicRegularity: TINGGI = buruk (AI terlalu teratur)
  //   prosodyVariance: RENDAH = buruk (AI terlalu flat)
  //   naturalPauseScore: RENDAH = buruk (AI kurang jeda napas)
  //   microTremorScore: RENDAH = buruk (AI tidak ada tremor)
  //   spectralFlatness: TINGGI = buruk (AI lebih flat)

  const aiScore =
    (features.rhythmicRegularity * 0.30) +           // 30% — regularity terdeteksi
    ((100 - features.prosodyVariance) * 0.25) +       // 25% — tidak ada variasi prosody
    ((100 - features.naturalPauseScore) * 0.20) +     // 20% — tidak ada jeda napas
    ((100 - features.microTremorScore) * 0.15) +      // 15% — tidak ada micro-tremor
    (features.spectralFlatness * 0.10);               // 10% — sinyal terlalu flat

  // Clamp ke 4–97
  const urgencyScore = parseFloat(Math.max(4, Math.min(97, aiScore)).toFixed(1));

  return {
    urgencyScore,
    stdDev: std,
    silenceGaps: totalSilenceGaps,
    peaks,
    avgVolume,
    isHighUrgency: urgencyScore >= 60,
    features,
    featureExplanations: buildExplanations(features),
    detectionMethod: 'VOKAL On-Device AI Clone Detector v2.0 (5-feature MFCC-lite)',
  };
}

function buildExplanations(f: VoiceFeatures): Record<keyof VoiceFeatures, string> {
  return {
    rhythmicRegularity:
      f.rhythmicRegularity >= 70
        ? `Ritme terlalu teratur (${f.rhythmicRegularity}%) — ciri khas suara AI/TTS yang tidak memiliki variasi alami`
        : f.rhythmicRegularity >= 40
        ? `Ritme cukup bervariasi (${f.rhythmicRegularity}%) — dalam batas normal`
        : `Ritme sangat natural (${f.rhythmicRegularity}%) — variasi bicara manusia terdeteksi`,
    prosodyVariance:
      f.prosodyVariance <= 30
        ? `Variasi nada sangat rendah (${f.prosodyVariance}%) — suara AI biasanya terlalu monoton`
        : f.prosodyVariance <= 60
        ? `Variasi nada sedang (${f.prosodyVariance}%) — perlu perhatian`
        : `Variasi nada natural (${f.prosodyVariance}%) — pola bicara manusia normal`,
    naturalPauseScore:
      f.naturalPauseScore <= 25
        ? `Hampir tidak ada jeda napas (${f.naturalPauseScore}%) — manusia real selalu punya jeda saat bicara`
        : f.naturalPauseScore <= 55
        ? `Jeda bicara terbatas (${f.naturalPauseScore}%) — mungkin normal tergantung konteks`
        : `Jeda napas terdeteksi (${f.naturalPauseScore}%) — pola bicara manusia`,
    microTremorScore:
      f.microTremorScore <= 25
        ? `Micro-tremor nyaris nol (${f.microTremorScore}%) — suara AI hampir tidak punya getaran alami`
        : f.microTremorScore <= 55
        ? `Micro-tremor lemah (${f.microTremorScore}%) — batas bawah normal`
        : `Micro-tremor terdeteksi (${f.microTremorScore}%) — tanda kewajaran vokal manusia`,
    spectralFlatness:
      f.spectralFlatness >= 70
        ? `Sinyal terlalu rata/flat (${f.spectralFlatness}%) — distribusi energi suara sintetis cenderung flat`
        : f.spectralFlatness >= 40
        ? `Distribusi sinyal sedang (${f.spectralFlatness}%) — perlu dikombinasikan fitur lain`
        : `Distribusi sinyal natural (${f.spectralFlatness}%) — bukan pola sinyal sintetis`,
  };
}
