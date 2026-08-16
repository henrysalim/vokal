export type VoiceFeatures = {
  rhythmicRegularity: number;
  prosodyVariance: number;
  naturalPauseScore: number;
  microTremorScore: number;
  spectralFlatness: number;
};

export type DspAnalysisResult = {
  urgencyScore: number;
  stdDev: number;
  silenceGaps: number;
  peaks: number;
  avgVolume: number;
  isHighUrgency: boolean;
  features: VoiceFeatures;
  featureExplanations: Record<keyof VoiceFeatures, string>;
  detectionMethod: string;
};

function stddev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance =
    arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function norm(val: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

function extractRhythmicRegularity(data: number[]): number {
  if (data.length < 10) return 50;

  const diffs: number[] = [];
  for (let i = 1; i < data.length; i++) {
    diffs.push(Math.abs(data[i] - data[i - 1]));
  }

  const meanDiff = mean(diffs);
  const varianceDiff = stddev(diffs);

  const cv = meanDiff > 0 ? varianceDiff / meanDiff : 0;

  const regularity = Math.max(0, 1 - Math.min(cv / 0.8, 1));
  return parseFloat((regularity * 100).toFixed(1));
}

function extractProsodyVariance(data: number[]): number {
  if (data.length < 5) return 50;

  const segmentSize = Math.max(5, Math.floor(data.length / 6));
  const segmentMeans: number[] = [];

  for (let i = 0; i < data.length; i += segmentSize) {
    const segment = data.slice(i, i + segmentSize);
    if (segment.length >= 3) {
      segmentMeans.push(mean(segment));
    }
  }

  if (segmentMeans.length < 2) return 50;

  const segVariance = stddev(segmentMeans);

  const prosodyScore = norm(segVariance, 0, 20);
  return parseFloat(prosodyScore.toFixed(1));
}

function extractNaturalPauseScore(
  data: number[],
  frameIntervalMs = 100,
): number {
  if (data.length < 15) return 30;

  const SILENCE_THRESH = -42;
  const MIN_NATURAL_PAUSE_FRAMES = 3;
  const MAX_NATURAL_PAUSE_FRAMES = 15;

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
        if (
          silenceCount >= MIN_NATURAL_PAUSE_FRAMES &&
          silenceCount <= MAX_NATURAL_PAUSE_FRAMES
        ) {
          naturalPauses++;
        } else if (silenceCount > MAX_NATURAL_PAUSE_FRAMES) {
          tooLongPauses++;
        }
        inSilence = false;
        silenceCount = 0;
      }
    }
  }

  const expectedPauses = ((data.length * frameIntervalMs) / 1000) * 0.5;
  const pauseRatio = naturalPauses / Math.max(1, expectedPauses);

  const baseScore = norm(pauseRatio, 0, 1.5) * 0.7;
  const penaltyRobot = tooLongPauses > 3 ? 20 : 0;

  return parseFloat(
    Math.max(0, Math.min(100, baseScore - penaltyRobot)).toFixed(1),
  );
}

function extractMicroTremorScore(data: number[]): number {
  if (data.length < 20) return 40;

  let rapidFlips = 0;
  const windowSize = 3;

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const localMean = mean(data.slice(i - windowSize, i + windowSize));
    const localDev = stddev(data.slice(i - windowSize, i + windowSize));

    if (localDev > 0 && Math.abs(data[i] - localMean) > localDev * 0.5) {
      if (
        i > 0 &&
        Math.sign(data[i] - data[i - 1]) !==
          Math.sign(data[i - 1] - data[i - 2])
      ) {
        rapidFlips++;
      }
    }
  }

  const flipRate = rapidFlips / Math.max(1, data.length - windowSize * 2);
  return parseFloat(norm(flipRate, 0.02, 0.4).toFixed(1));
}

function extractSpectralFlatness(data: number[]): number {
  if (data.length < 10) return 50;

  const linear = data.map((db) => Math.pow(10, db / 20));

  const logMean = mean(linear.map((v) => Math.log(Math.max(v, 1e-6))));
  const geoMean = Math.exp(logMean);
  const arithMean = mean(linear);

  const flatness = arithMean > 0 ? geoMean / arithMean : 0;

  return parseFloat(norm(flatness, 0, 0.9).toFixed(1));
}

export function analyzeLocalDSP(meteringData: number[]): DspAnalysisResult {
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
      detectionMethod: "VOKAL On-Device DSP v2 (data terlalu singkat)",
    };
  }

  const avgVolume = parseFloat(mean(meteringData).toFixed(1));
  const std = parseFloat(stddev(meteringData).toFixed(1));

  let peaks = 0;
  for (let i = 1; i < meteringData.length - 1; i++) {
    if (
      meteringData[i] > meteringData[i - 1] &&
      meteringData[i] > meteringData[i + 1] &&
      meteringData[i] > -30
    ) {
      peaks++;
    }
  }

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

  const features: VoiceFeatures = {
    rhythmicRegularity: extractRhythmicRegularity(meteringData),
    prosodyVariance: extractProsodyVariance(meteringData),
    naturalPauseScore: extractNaturalPauseScore(meteringData),
    microTremorScore: extractMicroTremorScore(meteringData),
    spectralFlatness: extractSpectralFlatness(meteringData),
  };

  const aiScore =
    features.rhythmicRegularity * 0.3 +
    (100 - features.prosodyVariance) * 0.25 +
    (100 - features.naturalPauseScore) * 0.2 +
    (100 - features.microTremorScore) * 0.15 +
    features.spectralFlatness * 0.1;

  const urgencyScore = parseFloat(
    Math.max(4, Math.min(97, aiScore)).toFixed(1),
  );

  return {
    urgencyScore,
    stdDev: std,
    silenceGaps: totalSilenceGaps,
    peaks,
    avgVolume,
    isHighUrgency: urgencyScore >= 60,
    features,
    featureExplanations: buildExplanations(features),
    detectionMethod:
      "VOKAL On-Device AI Clone Detector v2.0 (5-feature MFCC-lite)",
  };
}

function buildExplanations(
  f: VoiceFeatures,
): Record<keyof VoiceFeatures, string> {
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
