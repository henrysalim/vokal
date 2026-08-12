import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, ShieldAlert, ShieldCheck, Activity, Phone, AlertOctagon, HeartPulse, X, Zap, Cpu, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { analyzeLocalDSP, DspAnalysisResult } from '../../utils/audioAnalyzer';
import { AppText } from '../../components/ui/AppText';
import { EMERGENCY_CONTACTS } from '../../data/emergencyContacts';

type ScanState = 'idle' | 'recording' | 'analyzing' | 'result';

type FeatureBarProps = {
  label: string;
  value: number;
  /** Apakah nilai tinggi itu buruk (merah) atau baik (hijau) */
  highIsBad?: boolean;
  explanation: string;
};

function FeatureBar({ label, value, highIsBad = false, explanation }: FeatureBarProps) {
  const [expanded, setExpanded] = useState(false);
  const isBad = highIsBad ? value >= 65 : value <= 35;
  const color = isBad ? '#C1592E' : value >= 45 ? '#74822F' : '#E8A33D';
  const bgColor = isBad ? 'bg-terracotta/10' : value >= 45 ? 'bg-olive/10' : 'bg-mustard/10';
  const borderColor = isBad ? 'border-terracotta/20' : value >= 45 ? 'border-olive/20' : 'border-mustard/20';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      className={`${bgColor} border ${borderColor} rounded-xl p-3 mb-2`}
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
            <View
              className="h-full rounded-full"
              style={{ width: `${value}%`, backgroundColor: color }}
            />
          </View>
        </View>
      </View>
      {expanded && (
        <AppText size="xs" className="font-body text-text-muted leading-relaxed mt-1">
          {explanation}
        </AppText>
      )}
    </TouchableOpacity>
  );
}

export default function CekSuaraScreen() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [showPanicMode, setShowPanicMode] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [dspResult, setDspResult] = useState<DspAnalysisResult | null>(null);

  const pulse = useSharedValue(1);
  const breathPulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (showPanicMode) {
      breathPulse.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );

      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(60);
    }
  }, [showPanicMode]);

  const animatedPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value }));
  const animatedBreath = useAnimatedStyle(() => ({ transform: [{ scale: breathPulse.value }] }));

  const startScan = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin mikrofon dibutuhkan untuk memindai suara.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setScanState('recording');
      setDspResult(null);

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
        setScanState('analyzing');

        // Sedikit delay agar UI 'analyzing' terlihat
        setTimeout(() => {
          const result = analyzeLocalDSP(meteringData);
          setDspResult(result);
          setScanState('result');
        }, 1200);

      }, 5000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Gagal mengakses mikrofon.');
      setScanState('idle');
    }
  };

  const urgencyScore = dspResult?.urgencyScore ?? 0;
  const isHighRisk = urgencyScore >= 60;
  const features = dspResult?.features;
  const explanations = dspResult?.featureExplanations;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-1">
            <AppText size="2xl" className="font-heading text-espresso">Deteksi Kloning Suara</AppText>
            <View className="flex-row items-center gap-1 bg-olive/20 px-3 py-1 rounded-full border border-olive/40">
              <Cpu color="#74822F" size={11} />
              <AppText size="xs" className="text-olive font-bold uppercase tracking-wider">100% On-Device</AppText>
            </View>
          </View>
          <AppText size="xs" className="font-body text-text-muted leading-relaxed">
            Analisis 5-fitur MFCC-lite: ritme, prosodi, jeda napas, micro-tremor, dan spektral — semua di HP kamu, tanpa internet.
          </AppText>
        </View>

        {/* INTERACTIVE SCAN AREA */}
        <View className="items-center mb-8 mt-2">
          <View className="relative items-center justify-center h-44 w-44">
            {(scanState === 'recording' || scanState === 'analyzing') && (
              <>
                <Animated.View className="absolute w-40 h-40 rounded-full border border-mustard/50 bg-mustard/20" style={animatedPulse} />
                <Animated.View className="absolute w-56 h-56 rounded-full border border-mustard/20 bg-mustard/5" style={animatedPulse} />
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={scanState === 'idle' ? startScan : undefined}
              className="w-32 h-32 rounded-full items-center justify-center shadow-lg absolute"
              style={{ elevation: 8, shadowColor: scanState === 'idle' ? '#E8A33D' : '#74822F', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16 }}
            >
              <LinearGradient
                colors={scanState === 'idle' ? ['#E8A33D', '#C1592E'] : scanState === 'recording' ? ['#C1592E', '#7A2E28'] : ['#74822F', '#4A5320']}
                className="w-full h-full rounded-full items-center justify-center"
              >
                {scanState === 'idle' && <Mic color="#FFFFFF" size={44} />}
                {scanState === 'recording' && <Activity color="#FFFFFF" size={44} />}
                {scanState === 'analyzing' && <ShieldCheck color="#FFFFFF" size={44} />}
                {scanState === 'result' && <AlertOctagon color="#FFFFFF" size={44} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View className="mt-6 items-center h-16">
            {scanState === 'idle' && (
              <Animated.View entering={FadeIn}>
                <AppText size="base" className="text-espresso font-heading text-center">Tekan untuk Merekam (5 detik)</AppText>
                <AppText size="xs" className="text-text-muted font-body text-center mt-0.5">Cocok untuk live call atau klip audio apapun</AppText>
              </Animated.View>
            )}
            {scanState === 'recording' && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText size="base" className="text-terracotta font-heading text-center">Merekam (5 detik)...</AppText>
                <AppText size="xs" className="text-text-muted font-body mt-0.5">Arahkan ke sumber suara yang ingin dicek</AppText>
              </Animated.View>
            )}
            {scanState === 'analyzing' && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText size="base" className="text-olive font-heading text-center">Menganalisis 5 Fitur MFCC...</AppText>
                <AppText size="xs" className="text-text-muted font-body text-center mt-0.5">Ritme · Prosodi · Jeda · Tremor · Spektral</AppText>
              </Animated.View>
            )}
            {scanState === 'result' && (
              <Animated.View entering={FadeIn}>
                <AppText size="base" className="text-espresso font-heading text-center">Analisis Selesai</AppText>
              </Animated.View>
            )}
          </View>
        </View>

        {/* RESULTS SECTION */}
        {scanState === 'result' && dspResult && (
          <Animated.View entering={FadeInDown.springify()}>

            {/* OVERALL RISK BANNER */}
            {isHighRisk ? (
              <View className="w-full bg-warning/10 rounded-[24px] p-5 shadow-sm border-2 border-warning/30 mb-5">
                <View className="items-center mb-4 bg-white/60 p-4 rounded-2xl border border-warning/10">
                  <AppText size="3xl" className="font-display text-warning">{urgencyScore}%</AppText>
                  <AppText size="xs" className="text-warning font-heading mt-1 text-center uppercase tracking-wider">Risiko Kloning AI Terdeteksi</AppText>
                </View>

                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-warning/20 p-2.5 rounded-full">
                    <ShieldAlert color="#7A2E28" size={26} />
                  </View>
                  <View className="flex-1">
                    <AppText size="base" className="text-warning font-heading leading-tight">Pola Suara Sintetis Terdeteksi</AppText>
                    <AppText size="xs" className="text-espresso/70 font-body mt-0.5">Suara menunjukkan anomali kloning AI — sangat teratur, kurang variasi alami.</AppText>
                  </View>
                </View>

                <View className="bg-warning p-3.5 rounded-xl items-center">
                  <AppText size="sm" className="text-white font-heading uppercase tracking-wider">WASPADA — JANGAN TRANSFER / PERCAYA</AppText>
                </View>
              </View>
            ) : (
              <View className="w-full bg-olive/10 rounded-[24px] p-5 shadow-sm border-2 border-olive/30 mb-5">
                <View className="items-center mb-4 bg-white/60 p-4 rounded-2xl border border-olive/10">
                  <AppText size="3xl" className="font-display text-olive">{(100 - urgencyScore).toFixed(1)}%</AppText>
                  <AppText size="xs" className="text-olive font-heading mt-1 text-center uppercase tracking-wider">Kewajaran Vokal Manusia</AppText>
                </View>

                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-olive/20 p-2.5 rounded-full">
                    <ShieldCheck color="#74822F" size={26} />
                  </View>
                  <View className="flex-1">
                    <AppText size="base" className="text-olive font-heading leading-tight">Pola Bicara Natural</AppText>
                    <AppText size="xs" className="text-espresso/70 font-body mt-0.5">Tidak ada indikasi kloning AI. Variasi bicara alami terdeteksi.</AppText>
                  </View>
                </View>

                <View className="bg-olive p-3.5 rounded-xl items-center">
                  <AppText size="sm" className="text-white font-heading uppercase tracking-wider">AMAN — BUKAN INDIKASI SUARA SINTETIS</AppText>
                </View>
              </View>
            )}

            {/* 5-FEATURE BREAKDOWN */}
            <AppText size="sm" className="text-espresso font-heading mb-3">Breakdown 5 Fitur Deteksi:</AppText>

            <View className="mb-2">
              <AppText size="xs" className="text-text-muted font-body mb-3 leading-relaxed">
                Tap setiap fitur untuk lihat penjelasannya. {'\n'}Merah = mencurigakan · Hijau = alami · Kuning = perhatian
              </AppText>
            </View>

            {features && explanations && (
              <View className="mb-5">
                <FeatureBar
                  label="Ritme Reguler (AI = sangat teratur)"
                  value={features.rhythmicRegularity}
                  highIsBad
                  explanation={explanations.rhythmicRegularity}
                />
                <FeatureBar
                  label="Variasi Prosodi (AI = sangat flat)"
                  value={features.prosodyVariance}
                  highIsBad={false}
                  explanation={explanations.prosodyVariance}
                />
                <FeatureBar
                  label="Jeda Napas Natural (AI = tidak ada)"
                  value={features.naturalPauseScore}
                  highIsBad={false}
                  explanation={explanations.naturalPauseScore}
                />
                <FeatureBar
                  label="Micro-Tremor (AI = nyaris nol)"
                  value={features.microTremorScore}
                  highIsBad={false}
                  explanation={explanations.microTremorScore}
                />
                <FeatureBar
                  label="Spectral Flatness (AI = lebih rata)"
                  value={features.spectralFlatness}
                  highIsBad
                  explanation={explanations.spectralFlatness}
                />
              </View>
            )}

            {/* ENGINE INFO CARD */}
            <View className="bg-espresso/5 border border-espresso/10 rounded-2xl p-4 flex-row items-center gap-3 mb-5">
              <View className="w-9 h-9 rounded-full bg-olive/20 items-center justify-center">
                <Cpu color="#74822F" size={18} />
              </View>
              <View className="flex-1">
                <AppText size="xs" className="font-heading text-espresso">Engine: {dspResult.detectionMethod}</AppText>
                <AppText size="xs" className="font-body text-text-muted mt-0.5">
                  Data: {dspResult.silenceGaps} jeda · {dspResult.peaks} puncak · Avg: {dspResult.avgVolume} dB
                </AppText>
              </View>
              <View className="bg-olive/20 px-2 py-1 rounded-full">
                <AppText size="xs" className="text-olive font-bold">0ms</AppText>
              </View>
            </View>

            {/* PANIC MODE SHORTCUT */}
            {isHighRisk && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowPanicMode(true)}
                className="bg-espresso rounded-2xl py-4 px-5 flex-row items-center justify-between mb-4 shadow-sm"
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

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { setScanState('idle'); setDspResult(null); }}
              className="mt-2 py-3 items-center"
            >
              <AppText size="xs" className="text-text-muted font-heading">Pindai Ulang</AppText>
            </TouchableOpacity>

          </Animated.View>
        )}

      </ScrollView>

      {/* MODE TENANG (PANIC MODE) FULLSCREEN MODAL */}
      <Modal visible={showPanicMode} animationType="slide">
        <LinearGradient colors={['#2A363B', '#1C2529']} className="flex-1 justify-between px-6 pt-16 pb-12">
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
              Penipu sengaja membuatmu terburu-buru. Waktu berpihak padamu. Jangan bertindak sebelum menghubungi keluarga.
            </AppText>
          </View>

          <View className="gap-3">
            <AppText size="xs" className="text-white/50 font-display text-center uppercase tracking-widest mb-2">Hubungi Bantuan Resmi</AppText>
            {EMERGENCY_CONTACTS.slice(0, 2).map((contact) => (
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
      </Modal>

    </SafeAreaView>
  );
}
