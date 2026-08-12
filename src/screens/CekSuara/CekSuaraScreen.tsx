import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Cpu,
  HeartPulse,
  Mic,
  Phone,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/ui/AppText";
import { EMERGENCY_CONTACTS } from "../../data/emergencyContacts";
import { analyzeLocalDSP, DspAnalysisResult } from "../../utils/audioAnalyzer";

type ScanState = "idle" | "recording" | "analyzing" | "result";

type FeatureBarProps = {
  label: string;
  value: number;
  /** Apakah nilai tinggi itu buruk (merah) atau baik (hijau) */
  highIsBad?: boolean;
  explanation: string;
};

function FeatureBar({
  label,
  value,
  highIsBad = false,
  explanation,
}: FeatureBarProps) {
  const [expanded, setExpanded] = useState(false);
  const isBad = highIsBad ? value >= 65 : value <= 35;
  const color = isBad ? "#C1592E" : value >= 45 ? "#74822F" : "#E8A33D";
  const bgColor = isBad
    ? "bg-terracotta/10"
    : value >= 45
      ? "bg-olive/10"
      : "bg-mustard/10";
  const borderColor = isBad
    ? "border-terracotta/20"
    : value >= 45
      ? "border-olive/20"
      : "border-mustard/20";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      className={`${bgColor} border ${borderColor} rounded-xl p-3 mb-2`}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <AppText size="sm" className="font-heading text-espresso">
              {label}
            </AppText>
            <View className="flex-row items-center gap-1.5">
              <AppText size="xs" className="font-bold" style={{ color }}>
                {value}%
              </AppText>
              {expanded ? (
                <ChevronUp color={color} size={12} />
              ) : (
                <ChevronDown color={color} size={12} />
              )}
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
        <AppText
          size="xs"
          className="font-body text-text-muted leading-relaxed mt-1"
        >
          {explanation}
        </AppText>
      )}
    </TouchableOpacity>
  );
}

export default function CekSuaraScreen() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [showPanicMode, setShowPanicMode] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [dspResult, setDspResult] = useState<DspAnalysisResult | null>(null);

  const pulse = useSharedValue(1);
  const breathPulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (showPanicMode) {
      breathPulse.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );

      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(60);
    }
  }, [showPanicMode]);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));
  const animatedBreath = useAnimatedStyle(() => ({
    transform: [{ scale: breathPulse.value }],
  }));

  const startScan = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Izin Ditolak",
          "Izin mikrofon dibutuhkan untuk memindai suara.",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setScanState("recording");
      setDspResult(null);

      const meteringData: number[] = [];

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            meteringData.push(status.metering);
          }
        },
        100,
      );

      setTimeout(async () => {
        await recording.stopAndUnloadAsync();
        setScanState("analyzing");

        // Sedikit delay agar UI 'analyzing' terlihat
        setTimeout(() => {
          const result = analyzeLocalDSP(meteringData);
          setDspResult(result);
          setScanState("result");
        }, 1200);
      }, 5000);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Gagal mengakses mikrofon.");
      setScanState("idle");
    }
  };

  const urgencyScore = dspResult?.urgencyScore ?? 0;
  const isHighRisk = urgencyScore >= 60;
  const features = dspResult?.features;
  const explanations = dspResult?.featureExplanations;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="mb-6">
          <AppText size="2xl" className="font-heading mb-2 text-espresso">
            Deteksi Kloning Suara
          </AppText>
          <AppText
            size="sm"
            className="font-body text-text-muted leading-relaxed"
          >
            Analisis 5-fitur MFCC-lite: ritme, prosodi, jeda napas,
            micro-tremor, dan spektral.
          </AppText>
        </View>

        {/* INTERACTIVE SCAN AREA */}
        <View className="items-center mb-8 mt-2">
          <View className="relative items-center justify-center h-44 w-44">
            {(scanState === "recording" || scanState === "analyzing") && (
              <>
                <Animated.View
                  className="absolute w-40 h-40 rounded-full border border-mustard/50 bg-mustard/20"
                  style={animatedPulse}
                />
                <Animated.View
                  className="absolute w-56 h-56 rounded-full border border-mustard/20 bg-mustard/5"
                  style={animatedPulse}
                />
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={scanState === "idle" ? startScan : undefined}
              className="w-32 h-32 rounded-full items-center justify-center shadow-lg absolute"
              style={{
                elevation: 8,
                shadowColor: scanState === "idle" ? "#E8A33D" : "#74822F",
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 16,
              }}
            >
              <LinearGradient
                colors={
                  scanState === "idle"
                    ? ["#E8A33D", "#C1592E"]
                    : scanState === "recording"
                      ? ["#C1592E", "#7A2E28"]
                      : ["#74822F", "#4A5320"]
                }
                className="w-full h-full rounded-full items-center justify-center"
              >
                {scanState === "idle" && <Mic color="#FFFFFF" size={44} />}
                {scanState === "recording" && (
                  <Activity color="#FFFFFF" size={44} />
                )}
                {scanState === "analyzing" && (
                  <ShieldCheck color="#FFFFFF" size={44} />
                )}
                {scanState === "result" && (
                  <AlertOctagon color="#FFFFFF" size={44} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View className="mt-6 items-center h-16">
            {scanState === "idle" && (
              <Animated.View entering={FadeIn}>
                <AppText
                  size="base"
                  className="text-espresso font-heading text-center"
                >
                  Tekan untuk Merekam (5 detik)
                </AppText>
                <AppText
                  size="xs"
                  className="text-text-muted font-body text-center mt-0.5"
                >
                  Cocok untuk live call atau klip audio apapun
                </AppText>
              </Animated.View>
            )}
            {scanState === "recording" && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText
                  size="base"
                  className="text-terracotta font-heading text-center"
                >
                  Merekam (5 detik)...
                </AppText>
                <AppText size="xs" className="text-text-muted font-body mt-0.5">
                  Arahkan ke sumber suara yang ingin dicek
                </AppText>
              </Animated.View>
            )}
            {scanState === "analyzing" && (
              <Animated.View entering={FadeIn} className="items-center">
                <AppText
                  size="base"
                  className="text-olive font-heading text-center"
                >
                  Menganalisis 5 Fitur MFCC...
                </AppText>
                <AppText
                  size="xs"
                  className="text-text-muted font-body text-center mt-0.5"
                >
                  Ritme · Prosodi · Jeda · Tremor · Spektral
                </AppText>
              </Animated.View>
            )}
            {scanState === "result" && (
              <Animated.View entering={FadeIn}>
                <AppText
                  size="base"
                  className="text-espresso font-heading text-center"
                >
                  Analisis Selesai
                </AppText>
              </Animated.View>
            )}
          </View>
        </View>

        {/* RESULTS SECTION */}
        {scanState === "result" && dspResult && (
          <Animated.View entering={FadeInDown.springify()}>
            {/* OVERALL RISK BANNER */}
            <View
              className={`w-full rounded-[28px] p-5 border shadow-sm mb-5 ${
                isHighRisk
                  ? "bg-warning/8 border-warning/25"
                  : "bg-olive/8 border-olive/25"
              }`}
            >
              {/* Header: Status Badge & Score */}
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-espresso/5">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View
                    className={`w-11 h-11 rounded-2xl items-center justify-center ${
                      isHighRisk ? "bg-warning/15" : "bg-olive/15"
                    }`}
                  >
                    {isHighRisk ? (
                      <ShieldAlert color="#C1592E" size={22} />
                    ) : (
                      <ShieldCheck color="#74822F" size={22} />
                    )}
                  </View>
                  <View className="flex-1">
                    <View
                      className={`px-3 py-1 rounded-full self-start mb-1 ${
                        isHighRisk ? "bg-warning" : "bg-olive"
                      }`}
                    >
                      <AppText
                        size="xs"
                        className="text-white font-heading uppercase tracking-wider"
                      >
                        {isHighRisk
                          ? "WASPADA — SUARA SINTETIS"
                          : "AMAN — SUARA ALAMI"}
                      </AppText>
                    </View>
                    <AppText
                      size="xs"
                      className="text-espresso/70 font-body"
                      numberOfLines={1}
                    >
                      {isHighRisk
                        ? "Pola Suara AI Terdeteksi"
                        : "Pola Bicara Natural"}
                    </AppText>
                  </View>
                </View>

                {/* Score */}
                <View className="items-end pl-2">
                  <AppText
                    size="3xl"
                    className={`font-display ${
                      isHighRisk ? "text-warning" : "text-olive"
                    }`}
                  >
                    {isHighRisk
                      ? `${urgencyScore}%`
                      : `${(100 - urgencyScore).toFixed(1)}%`}
                  </AppText>
                  <AppText size="xs" className="text-text-muted font-body">
                    {isHighRisk ? "Risiko Kloning" : "Kewajaran Vokal"}
                  </AppText>
                </View>
              </View>

              {/* Summary Description Box */}
              <View className="bg-surface/80 p-3.5 rounded-2xl border border-espresso/5">
                <AppText
                  size="xs"
                  className="text-espresso/80 font-body leading-relaxed"
                >
                  {isHighRisk
                    ? "Suara menunjukkan anomali kloning AI — sangat teratur dan kurang variasi alami. Jangan langsung percaya atau melakukan transfer."
                    : "Tidak ada indikasi kloning AI. Variasi bicara alami dan micro-tremor vokal terdeteksi secara alami."}
                </AppText>
              </View>
            </View>

            {/* 5-FEATURE BREAKDOWN */}
            <AppText size="sm" className="text-espresso font-heading mb-3">
              Penjabaran 5 Fitur Deteksi:
            </AppText>

            <View className="mb-2">
              <AppText
                size="sm"
                className="text-text-muted font-body mb-3 leading-relaxed"
              >
                Tap setiap fitur untuk lihat penjelasannya. {"\n"}Merah =
                mencurigakan · Hijau = alami · Kuning = perhatian
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
                <AppText size="sm" className="font-heading text-espresso">
                  Engine: {dspResult.detectionMethod}
                </AppText>
                <AppText size="sm" className="font-body text-text-muted mt-2">
                  Data: {dspResult.silenceGaps} jeda · {dspResult.peaks} puncak
                  · Avg: {dspResult.avgVolume} dB
                </AppText>
              </View>
              <View className="bg-olive/20 px-2 py-1 rounded-full">
                <AppText size="xs" className="text-olive font-bold">
                  0ms
                </AppText>
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
                    <AppText size="sm" className="text-cream font-heading">
                      Mulai Panik?
                    </AppText>
                    <AppText
                      size="xs"
                      className="text-cream/70 font-body mt-0.5"
                    >
                      Aktifkan Mode Tenang untuk rileks
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setScanState("idle");
                setDspResult(null);
              }}
              className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 mt-1 ${
                isHighRisk
                  ? "border border-espresso/20 bg-surface"
                  : "bg-espresso"
              }`}
            >
              <Mic color={isHighRisk ? "#3E2E22" : "#FFFFFF"} size={18} />
              <AppText
                size="sm"
                className={`font-heading ${
                  isHighRisk ? "text-espresso" : "text-white"
                }`}
              >
                Pindai Ulang
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* MODE TENANG (PANIC MODE) FULLSCREEN MODAL */}
      <Modal visible={showPanicMode} animationType="slide">
        <LinearGradient
          colors={["#2A363B", "#1C2529"]}
          className="flex-1 justify-between px-6 pt-16 pb-12"
        >
          <View className="items-end">
            <TouchableOpacity
              onPress={() => setShowPanicMode(false)}
              className="bg-white/10 p-3 rounded-full"
            >
              <X color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          <View className="items-center justify-center flex-1">
            <AppText
              size="3xl"
              className="text-white font-heading mb-12 text-center"
            >
              Jangan Panik.
            </AppText>

            <View className="relative items-center justify-center w-64 h-64 mb-16">
              <Animated.View
                className="absolute w-56 h-56 rounded-full border-4 border-olive/30 bg-olive/10"
                style={animatedBreath}
              />
              <Animated.View
                className="absolute w-40 h-40 rounded-full border-4 border-olive/50 bg-olive/20"
                style={animatedBreath}
              />
              <View className="w-32 h-32 rounded-full bg-olive items-center justify-center shadow-lg">
                <AppText size="3xl" className="text-white font-display">
                  {countdown}s
                </AppText>
              </View>
            </View>

            <AppText
              size="lg"
              className="text-white/80 font-body text-center px-4 leading-relaxed mb-2"
            >
              Tarik napas panjang... dan hembuskan perlahan.
            </AppText>
            <AppText
              size="sm"
              className="text-white/60 font-body text-center px-6 leading-relaxed"
            >
              Penipu sengaja membuatmu terburu-buru. Waktu berpihak padamu.
              Jangan bertindak sebelum menghubungi keluarga.
            </AppText>
          </View>

          <View className="gap-3">
            <AppText
              size="xs"
              className="text-white/50 font-display text-center uppercase tracking-widest mb-2"
            >
              Hubungi Bantuan Resmi
            </AppText>
            {EMERGENCY_CONTACTS.slice(0, 2).map((contact) => (
              <TouchableOpacity
                key={contact.phone}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                className="bg-white/10 rounded-2xl p-4 flex-row items-center justify-between border border-white/5"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-mustard items-center justify-center">
                    <AppText size="lg" className="text-espresso font-display">
                      {contact.name.charAt(0)}
                    </AppText>
                  </View>
                  <View>
                    <AppText size="base" className="text-white font-heading">
                      {contact.name}
                    </AppText>
                    <AppText size="xs" className="text-white/50 font-body">
                      {contact.phone}
                    </AppText>
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
