import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mic, ShieldAlert, ShieldCheck, Activity, Phone,
  AlertOctagon, HeartPulse, X, Cpu, ChevronDown, ChevronUp,
  Sparkles, RotateCcw, Zap, ChevronLeft
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  Easing, withSequence, FadeIn, FadeInDown
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { analyzeLocalDSP, DspAnalysisResult } from '../../utils/audioAnalyzer';
import { analyzeWithGemini, GeminiAnalysisResult } from '../../utils/geminiAnalyzer';
import { AppText } from '../../components/ui/AppText';
import { useConfirmModal } from '../../components/ui/ConfirmModal';
import { useNavigation } from '@react-navigation/native';
import { EMERGENCY_CONTACTS } from '../../data/emergencyContacts';

type ScanState = 'idle' | 'recording' | 'analyzing_local' | 'analyzing_gemini' | 'result';

// ─── FeatureBar ───────────────────────────────────────────────────

function FeatureBar({
  label, value, highIsBad = false, explanation,
}: {
  label: string; value: number; highIsBad?: boolean; explanation: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isBad = highIsBad ? value >= 65 : value <= 35;
  const color = isBad ? '#C1592E' : value >= 45 ? '#74822F' : '#E8A33D';
  const bgClass = isBad ? 'bg-terracotta/8 border-terracotta/20' : value >= 45 ? 'bg-olive/8 border-olive/20' : 'bg-mustard/8 border-mustard/20';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      className={`${bgClass} border rounded-xl p-3 mb-2`}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <AppText size="xs" className="font-heading text-espresso">{label}</AppText>
            <View className="flex-row items-center gap-1.5">
              <AppText size="xs" className="font-bold" style={{ color }}>{value}%</AppText>
              {expanded ? <ChevronUp color={color} size={12} /> : <ChevronDown color={color} size={12} />}
            </View>
          </View>
          <View className="h-2 bg-espresso/10 rounded-full overflow-hidden">
            <View className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
          </View>
        </View>
      </View>
      {expanded && (
        <AppText size="xs" className="font-body text-text-muted leading-relaxed mt-1">{explanation}</AppText>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────

export default function CekSuaraScreen() {
  const navigation = useNavigation();
  const { showConfirm } = useConfirmModal();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [showPanicMode, setShowPanicMode] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [dspResult, setDspResult] = useState<DspAnalysisResult | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiAnalysisResult | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const pulse = useSharedValue(1);
  const breathPulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  useEffect(() => {
    if (showPanicMode) {
      breathPulse.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
      const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 0), 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(60);
    }
  }, [showPanicMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (scanState === 'recording') {
      setRecordingSeconds(0);
      interval = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [scanState]);

  const animatedPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value }));
  const animatedBreath = useAnimatedStyle(() => ({ transform: [{ scale: breathPulse.value }] }));

  const startScan = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        showConfirm({
          title: 'Izin Ditolak',
          message: 'Izin mikrofon dibutuhkan untuk memindai suara.',
          confirmText: 'Mengerti',
          cancelText: '',
          variant: 'terracotta',
          iconType: 'warning',
        });
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      setScanState('recording');
      setDspResult(null);
      setGeminiResult(null);

      const meteringData: number[] = [];
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            meteringData.push(status.metering);
          }
        },
        100
      );

      setTimeout(async () => {
        await recording.stopAndUnloadAsync();

        // Step 1: DSP local analysis (instant)
        setScanState('analyzing_local');
        await new Promise(r => setTimeout(r, 600));
        const dsp = analyzeLocalDSP(meteringData);
        setDspResult(dsp);

        // Step 2: Gemini analysis (using DSP features as input)
        setScanState('analyzing_gemini');
        try {
          const gemini = await analyzeWithGemini({
            type: 'voice',
            dspFeatures: {
              rhythmicRegularity: dsp.features.rhythmicRegularity,
              prosodyVariance: dsp.features.prosodyVariance,
              naturalPauseScore: dsp.features.naturalPauseScore,
              microTremorScore: dsp.features.microTremorScore,
              spectralFlatness: dsp.features.spectralFlatness,
              urgencyScore: dsp.urgencyScore,
            },
          });
          setGeminiResult(gemini);
        } catch {
          // Gemini gagal — tetap tampilkan hasil DSP saja
        }

        const score = geminiResult ? Math.round(geminiResult.score * 0.65 + dsp.urgencyScore * 0.35) : dsp.urgencyScore;
        const status = score >= 60 ? "bahaya" : score >= 30 ? "waspada" : "aman";
        const statusText = status === "bahaya" ? "Kloning AI terdeteksi" : status === "waspada" ? "Mencurigakan" : "Normal/Aman";
        import("../../utils/analysisHistory").then(({ addAnalysisLog }) => {
          addAnalysisLog("suara", "Cek Suara: Rekaman Audio Baru", `Risiko Kloning AI: ${score}% (${statusText}).`, status);
        });
        setScanState('result');
      }, 5000);

    } catch (err) {
      console.error('Recording error', err);
      showConfirm({
        title: 'Error',
        message: 'Gagal mengakses mikrofon.',
        confirmText: 'Tutup',
        cancelText: '',
        variant: 'terracotta',
        iconType: 'danger',
      });
      setScanState('idle');
    }
  };

  const handleReset = () => {
    setScanState('idle');
    setDspResult(null);
    setGeminiResult(null);
  };

  // Gabungkan skor DSP + Gemini
  const finalScore = geminiResult
    ? Math.round(geminiResult.score * 0.65 + (dspResult?.urgencyScore ?? 0) * 0.35)
    : (dspResult?.urgencyScore ?? 0);

  const isHighRisk = finalScore >= 60;
  const features = dspResult?.features;
  const explanations = dspResult?.featureExplanations;

  // ── Mic button color ─────────────────────────────────────────────
  const micColors: [string, string] =
    scanState === 'idle' ? ['#E8A33D', '#C1592E'] :
    scanState === 'recording' ? ['#C1592E', '#7A2E28'] :
    ['#74822F', '#4A5320'];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <View className="flex-row items-center px-5 pt-3 pb-1 gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-espresso/8 items-center justify-center">
          <ChevronLeft color="#3E2E22" size={24} />
        </TouchableOpacity>
        <AppText size="lg" className="text-espresso font-heading">Kembali</AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 12 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-1">
            <AppText size="2xl" className="font-heading text-espresso">Deteksi Kloning Suara</AppText>
            <View className="flex-row items-center gap-1 bg-olive/20 px-3 py-1 rounded-full border border-olive/40">
              <Cpu color="#74822F" size={11} />
              <AppText size="xs" className="text-olive font-bold uppercase tracking-wider">On-Device</AppText>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Sparkles color="#C1592E" size={12} />
            <AppText size="xs" className="font-body text-terracotta">
              DSP Lokal + Gemini AI: analisis ganda untuk akurasi lebih tinggi
            </AppText>
          </View>
        </View>

        {/* Mic Circle */}
        <View className="items-center mb-8 mt-2">
          <View className="relative items-center justify-center h-44 w-44">
            {(scanState === 'recording') && (
              <>
                <Animated.View className="absolute w-40 h-40 rounded-full border border-terracotta/50 bg-terracotta/15" style={animatedPulse} />
                <Animated.View className="absolute w-56 h-56 rounded-full border border-terracotta/20 bg-terracotta/5" style={animatedPulse} />
              </>
            )}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={scanState === 'idle' ? startScan : undefined}
              className="w-32 h-32 rounded-full items-center justify-center absolute"
              style={{ elevation: 8, shadowColor: '#E8A33D', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16 }}
            >
              <LinearGradient colors={micColors} className="w-full h-full rounded-full items-center justify-center">
                {scanState === 'idle' && <Mic color="#FFFFFF" size={44} />}
                {scanState === 'recording' && <Activity color="#FFFFFF" size={44} />}
                {(scanState === 'analyzing_local' || scanState === 'analyzing_gemini') && <Sparkles color="#FFFFFF" size={44} />}
                {scanState === 'result' && (isHighRisk ? <AlertOctagon color="#FFFFFF" size={44} /> : <ShieldCheck color="#FFFFFF" size={44} />)}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Status text */}
          <View className="mt-6 items-center min-h-[64px]">
            {scanState === 'idle' && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText size="base" className="text-espresso font-heading text-center">Tekan untuk Merekam (5 detik)</AppText>
                <AppText size="xs" className="text-text-muted font-body text-center mt-0.5">Cocok untuk live call atau klip audio apapun</AppText>
              </Animated.View>
            )}
            {scanState === 'recording' && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText size="base" className="text-terracotta font-heading text-center">Merekam... {recordingSeconds}/5 detik</AppText>
                <AppText size="xs" className="text-text-muted font-body mt-0.5">Arahkan ke sumber suara yang ingin dicek</AppText>
              </Animated.View>
            )}
            {scanState === 'analyzing_local' && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText size="base" className="text-espresso font-heading text-center">Analisis DSP Lokal...</AppText>
                <AppText size="xs" className="text-text-muted font-body text-center mt-0.5">Ritme · Prosodi · Jeda · Tremor · Spektral</AppText>
              </Animated.View>
            )}
            {scanState === 'analyzing_gemini' && (
              <Animated.View entering={FadeIn} className="items-center">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Sparkles color="#C1592E" size={14} />
                  <AppText size="base" className="text-terracotta font-heading text-center">Gemini Menganalisis...</AppText>
                </View>
                <AppText size="xs" className="text-text-muted font-body text-center">Interpretasi AI mendalam berdasarkan fitur DSP</AppText>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Results */}
        {scanState === 'result' && dspResult && (
          <Animated.View entering={FadeInDown.springify()}>

            {/* Combined Score Banner */}
            {isHighRisk ? (
              <View className="w-full bg-terracotta/10 rounded-[24px] p-5 border-2 border-terracotta/30 mb-5">
                <View className="items-center mb-4 bg-white/60 p-4 rounded-2xl">
                  <AppText size="3xl" className="font-display text-terracotta">{finalScore}%</AppText>
                  <AppText size="xs" className="text-terracotta font-heading mt-1 uppercase tracking-wider">Risiko Kloning AI</AppText>
                </View>
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-terracotta/20 p-2.5 rounded-full">
                    <ShieldAlert color="#7A2E28" size={26} />
                  </View>
                  <View className="flex-1">
                    <AppText size="base" className="text-terracotta font-heading leading-tight">Pola Suara Sintetis Terdeteksi</AppText>
                    <AppText size="xs" className="text-espresso/70 font-body mt-0.5">Suara menunjukkan anomali kloning AI.</AppText>
                  </View>
                </View>
                <View className="bg-terracotta p-3.5 rounded-xl items-center">
                  <AppText size="sm" className="text-white font-heading uppercase tracking-wider">WASPADA: JANGAN PERCAYA</AppText>
                </View>
              </View>
            ) : (
              <View className="w-full bg-olive/10 rounded-[24px] p-5 border-2 border-olive/30 mb-5">
                <View className="items-center mb-4 bg-white/60 p-4 rounded-2xl">
                  <AppText size="3xl" className="font-display text-olive">{(100 - finalScore).toFixed(0)}%</AppText>
                  <AppText size="xs" className="text-olive font-heading mt-1 uppercase tracking-wider">Kewajaran Vokal Manusia</AppText>
                </View>
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-olive/20 p-2.5 rounded-full">
                    <ShieldCheck color="#74822F" size={26} />
                  </View>
                  <View className="flex-1">
                    <AppText size="base" className="text-olive font-heading leading-tight">Pola Bicara Natural</AppText>
                    <AppText size="xs" className="text-espresso/70 font-body mt-0.5">Tidak ada indikasi kloning AI yang signifikan.</AppText>
                  </View>
                </View>
                <View className="bg-olive p-3.5 rounded-xl items-center">
                  <AppText size="sm" className="text-white font-heading uppercase tracking-wider">AMAN: BUKAN SUARA SINTETIS</AppText>
                </View>
              </View>
            )}

            {/* Gemini Result Card */}
            {geminiResult && (
              <View className="bg-surface rounded-2xl p-4 border border-terracotta/15 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Sparkles color="#C1592E" size={16} />
                  <AppText size="sm" className="font-heading text-espresso">Interpretasi Gemini AI</AppText>
                  <View className="bg-terracotta/10 px-2 py-0.5 rounded-full ml-auto">
                    <AppText size="xs" className="text-terracotta font-bold">{geminiResult.verdict}</AppText>
                  </View>
                </View>
                <AppText size="xs" className="font-body text-espresso/70 leading-relaxed">{geminiResult.summary}</AppText>
                {geminiResult.flags.map(flag => (
                  <View key={flag.id} className="mt-2 flex-row items-start gap-2">
                    <View className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: flag.level === 'danger' ? '#C1592E' : flag.level === 'warning' ? '#E8A33D' : '#74822F' }} />
                    <AppText size="xs" className="font-body text-espresso/70 flex-1 leading-relaxed">{flag.description}</AppText>
                  </View>
                ))}
              </View>
            )}

            {/* DSP Feature Breakdown */}
            <AppText size="sm" className="text-espresso font-heading mb-2">Analisis DSP Lokal (5 Fitur):</AppText>
            <AppText size="xs" className="text-text-muted font-body mb-3 leading-relaxed">
              Tap fitur untuk lihat penjelasan • Merah=mencurigakan · Hijau=alami
            </AppText>

            {features && explanations && (
              <View className="mb-4">
                <FeatureBar label="Ritme Reguler (AI=teratur)" value={features.rhythmicRegularity} highIsBad explanation={explanations.rhythmicRegularity} />
                <FeatureBar label="Variasi Prosodi (AI=flat)" value={features.prosodyVariance} explanation={explanations.prosodyVariance} />
                <FeatureBar label="Jeda Napas Natural (AI=tidak ada)" value={features.naturalPauseScore} explanation={explanations.naturalPauseScore} />
                <FeatureBar label="Micro-Tremor (AI=nol)" value={features.microTremorScore} explanation={explanations.microTremorScore} />
                <FeatureBar label="Spectral Flatness (AI=rata)" value={features.spectralFlatness} highIsBad explanation={explanations.spectralFlatness} />
              </View>
            )}

            {/* Score detail */}
            <View className="bg-espresso/5 border border-espresso/10 rounded-2xl p-4 flex-row items-center gap-3 mb-5">
              <View className="w-9 h-9 rounded-full bg-espresso/10 items-center justify-center">
                <Zap color="#3E2E22" size={16} />
              </View>
              <View className="flex-1">
                <AppText size="xs" className="font-heading text-espresso">
                  DSP: {dspResult.urgencyScore}% {geminiResult ? `· Gemini: ${geminiResult.score}%` : ''} · Final: {finalScore}%
                </AppText>
                <AppText size="xs" className="font-body text-text-muted mt-0.5">
                  {dspResult.silenceGaps} jeda · {dspResult.peaks} puncak · Avg: {dspResult.avgVolume} dB
                </AppText>
              </View>
            </View>

            {/* Panic Mode */}
            {isHighRisk && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowPanicMode(true)}
                className="bg-espresso rounded-2xl py-4 px-5 flex-row items-center justify-between mb-4"
              >
                <View className="flex-row items-center gap-3">
                  <HeartPulse color="#E8A33D" size={24} />
                  <View>
                    <AppText size="sm" className="text-cream font-heading">Mulai Panik?</AppText>
                    <AppText size="xs" className="text-cream/70 font-body mt-0.5">Aktifkan Mode Tenang untuk rileks</AppText>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Reset */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleReset}
              className="py-3 items-center flex-row justify-center gap-2 border border-espresso/15 rounded-2xl"
            >
              <RotateCcw color="#3E2E22" size={16} />
              <AppText size="xs" className="text-espresso font-heading">Pindai Ulang</AppText>
            </TouchableOpacity>

          </Animated.View>
        )}

      </ScrollView>

      {/* Panic Mode Modal */}
      <Modal visible={showPanicMode} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "#1C2529" }}>
          <LinearGradient colors={['#2A363B', '#1C2529']} style={{ flex: 1 }} className="justify-between px-6 pt-16 pb-12">
            <View className="items-end">
              <TouchableOpacity onPress={() => setShowPanicMode(false)} className="bg-white/10 p-3 rounded-full">
                <X color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
            <View className="items-center justify-center flex-1">
              <AppText size="3xl" className="text-white font-heading mb-12 text-center">Jangan Panik.</AppText>
              <View className="relative items-center justify-center w-64 h-64 mb-16">
                <Animated.View className="absolute w-56 h-56 rounded-full border-4 border-olive/30 bg-olive/10" style={animatedBreath} />
                <Animated.View className="absolute w-40 h-40 rounded-full border-4 border-olive/50 bg-olive/20" style={animatedBreath} />
                <View className="w-32 h-32 rounded-full bg-olive items-center justify-center shadow-lg">
                  <AppText size="3xl" className="text-white font-display">{countdown}s</AppText>
                </View>
              </View>
              <AppText size="lg" className="text-white/80 font-body text-center px-4 leading-relaxed mb-2">
                Tarik napas panjang... dan hembuskan perlahan.
              </AppText>
              <AppText size="sm" className="text-white/60 font-body text-center px-6 leading-relaxed">
                Penipu sengaja membuatmu terburu-buru. Waktu berpihak padamu.
              </AppText>
            </View>
            <View className="gap-3">
              <AppText size="xs" className="text-white/50 font-display text-center uppercase tracking-widest mb-2">
                Hubungi Bantuan Resmi
              </AppText>
              {EMERGENCY_CONTACTS.slice(0, 2).map(contact => (
                <TouchableOpacity
                  key={contact.phone}
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  className="bg-white/10 rounded-2xl p-4 flex-row items-center justify-between border border-white/5"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-full bg-mustard items-center justify-center">
                      <AppText size="lg" className="text-espresso font-display">{contact.name.charAt(0)}</AppText>
                    </View>
                    <View>
                      <AppText size="base" className="text-white font-heading">{contact.name}</AppText>
                      <AppText size="xs" className="text-white/50 font-body">{contact.phone}</AppText>
                    </View>
                  </View>
                  <View className="bg-olive p-3 rounded-full">
                    <Phone color="#FFFFFF" size={18} fill="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
