import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, ShieldAlert, ShieldCheck, Activity, Phone, AlertOctagon, HeartPulse, X, Cloud, CloudOff, Zap } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { FAMILY_MEMBERS } from '../../data/mock';
import { analyzeLocalDSP, DspAnalysisResult } from '../../utils/audioAnalyzer';
import { API_CONFIG } from '../../utils/config';

type ScanState = 'idle' | 'recording' | 'analyzing' | 'result';

export default function CekSuaraScreen() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [showPanicMode, setShowPanicMode] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Analysis States
  const [dspResult, setDspResult] = useState<DspAnalysisResult | null>(null);
  const [cloudScore, setCloudScore] = useState<number | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isCloudScanning, setIsCloudScanning] = useState(false);
  const [finalCombinedScore, setFinalCombinedScore] = useState(0);

  const pulse = useSharedValue(1);
  const breathPulse = useSharedValue(1);

  // Mic Pulsing Animation
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

  // Breathing Animation for Panic Mode
  useEffect(() => {
    if (showPanicMode) {
      breathPulse.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.sin) }), // Inhale
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) })    // Exhale
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
      setCloudScore(null);
      setIsOfflineMode(false);

      const meteringData: number[] = [];

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            meteringData.push(status.metering);
          }
        },
        100 // Update interval 100ms
      );

      // Record for 5 seconds for optimal DSP sampling
      setTimeout(async () => {
        await recording.stopAndUnloadAsync();
        const recordingUri = recording.getURI();
        setScanState('analyzing');

        // ==========================================
        // PHASE 1: INSTANT LOCAL DSP ANALYZER (Pure JS, 0ms Latency)
        // ==========================================
        const localDsp = analyzeLocalDSP(meteringData);
        setDspResult(localDsp);

        // ==========================================
        // PHASE 2: CLOUD AI ESCALATION & OFFLINE FALLBACK
        // ==========================================
        setIsCloudScanning(true);
        let cloudProbability: number | null = null;

        if (recordingUri) {
          try {
            const formData = new FormData();
            formData.append('audio', {
              uri: recordingUri,
              type: 'audio/m4a',
              name: 'recording.m4a',
            } as any);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/scan`, {
              method: 'POST',
              body: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data && typeof data.ai_probability === 'number') {
                cloudProbability = data.ai_probability;
                setCloudScore(cloudProbability);
              }
            } else {
              setIsOfflineMode(true);
            }
          } catch (error) {
            console.log('⚠️ Server Cloud AI offline/unreachable. Falling back to On-Device DSP.');
            setIsOfflineMode(true);
          } finally {
            setIsCloudScanning(false);
          }
        } else {
          setIsOfflineMode(true);
          setIsCloudScanning(false);
        }

        // ==========================================
        // PHASE 3: COMBINED HYBRID RISK SCORE
        // ==========================================
        let finalScore = localDsp.urgencyScore;
        if (cloudProbability !== null) {
          // Weighted Hybrid: 40% Local DSP Urgency + 60% Cloud Spectral AI
          finalScore = (localDsp.urgencyScore * 0.4) + (cloudProbability * 0.6);
        }

        setFinalCombinedScore(parseFloat(finalScore.toFixed(1)));
        setScanState('result');

      }, 5000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Gagal mengakses mikrofon.');
      setScanState('idle');
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-3xl font-heading text-espresso">Audio Risk Toolkit</Text>
            <View className="flex-row items-center gap-1 bg-mustard/20 px-3 py-1 rounded-full border border-mustard/40">
              <Zap color="#E8A33D" size={12} />
              <Text className="text-mustard font-bold text-[10px] uppercase tracking-wider">Engine Hybrid</Text>
            </View>
          </View>
          <Text className="text-xs font-body text-text-muted leading-relaxed">
            Deteksi 2-lapis: DSP On-Device (0ms latensi) memindai pola tekanan vokal, dilanjutkan Verifikasi Spektral Cloud AI.
          </Text>
        </View>

        {/* INTERACTIVE SCAN AREA */}
        <View className="items-center mb-8 mt-2">
          <View className="relative items-center justify-center h-44 w-44">
            {(scanState === 'recording' || scanState === 'analyzing') && (
              <>
                <Animated.View className="absolute w-40 h-40 rounded-full border border-mustard/50 bg-mustard/20" style={animatedPulse} />
                <Animated.View className="absolute w-56 h-56 rounded-full border border-mustard/20 bg-mustard/5" style={[animatedPulse, { animationDelay: '200ms' }]} />
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
              <Animated.Text entering={FadeIn} className="text-espresso text-base font-heading text-center">Tekan untuk Merekam Live</Animated.Text>
            )}
            {scanState === 'recording' && (
              <Animated.View entering={FadeIn} className="items-center">
                <Text className="text-terracotta text-base font-heading text-center">Merekam Percakapan (5s)...</Text>
                <Text className="text-text-muted text-xs font-body mt-0.5">Memproses sinyal amplitudo mikrofon</Text>
              </Animated.View>
            )}
            {scanState === 'analyzing' && (
              <Animated.View entering={FadeIn} className="items-center">
                <Text className="text-olive text-base font-heading text-center">Memproses Pipeline Hybrid...</Text>
                <Text className="text-text-muted text-xs font-body text-center mt-0.5">DSP On-Device ⚡ & Spektral Cloud ☁️</Text>
              </Animated.View>
            )}
            {scanState === 'result' && (
              <Animated.Text entering={FadeIn} className="text-espresso text-base font-heading text-center">Hasil Pemindaian Selesai</Animated.Text>
            )}
          </View>
        </View>

        {/* RESULTS SECTION */}
        {scanState === 'result' && (
          <Animated.View entering={FadeInDown.springify()}>
            
            {/* OVERALL RISK BANNER */}
            {finalCombinedScore >= 60 ? (
              <View className="w-full bg-warning/10 rounded-[24px] p-5 shadow-sm border-2 border-warning/30 mb-5">
                <View className="items-center mb-4 bg-white/60 p-4 rounded-2xl border border-warning/10">
                  <Text className="text-4xl font-display text-warning">{finalCombinedScore}%</Text>
                  <Text className="text-warning text-xs font-heading mt-1 text-center uppercase tracking-wider">Tingkat Risiko Scam / Kloning AI</Text>
                </View>

                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-warning/20 p-2.5 rounded-full">
                    <ShieldAlert color="#7A2E28" size={26} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-warning text-base font-heading leading-tight">Terdeteksi Pola Mencurigakan</Text>
                    <Text className="text-espresso/70 text-xs font-body mt-0.5">Suara menunjukkan anomali psikologis / sintetis.</Text>
                  </View>
                </View>

                <View className="bg-warning p-3.5 rounded-xl items-center">
                  <Text className="text-white font-heading text-sm uppercase tracking-wider">WASPADA SCAM / JANGAN TRANSFER</Text>
                </View>
              </View>
            ) : (
              <View className="w-full bg-olive/10 rounded-[24px] p-5 shadow-sm border-2 border-olive/30 mb-5">
                <View className="items-center mb-4 bg-white/60 p-4 rounded-2xl border border-olive/10">
                  <Text className="text-4xl font-display text-olive">{(100 - finalCombinedScore).toFixed(1)}%</Text>
                  <Text className="text-olive text-xs font-heading mt-1 text-center uppercase tracking-wider">Tingkat Kewajaran Vokal</Text>
                </View>

                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-olive/20 p-2.5 rounded-full">
                    <ShieldCheck color="#74822F" size={26} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-olive text-base font-heading leading-tight">Pola Bicara Natural</Text>
                    <Text className="text-espresso/70 text-xs font-body mt-0.5">Tidak ada indikasi urgensi tergesa-gesa atau anomali bot.</Text>
                  </View>
                </View>

                <View className="bg-olive p-3.5 rounded-xl items-center">
                  <Text className="text-white font-heading text-sm uppercase tracking-wider">AMAN — TIDAK ADA INDIKASI SCAM</Text>
                </View>
              </View>
            )}

            {/* DUAL LAYER BREAKDOWN CARDS */}
            <Text className="text-espresso font-heading text-sm mb-3">Rincian Analisis Hybrid Layer:</Text>
            
            <View className="gap-3 mb-5">
              
              {/* LAYER 1: ON-DEVICE DSP CARD */}
              <View className="bg-surface rounded-2xl p-4 border border-espresso/10 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-10 h-10 rounded-full bg-mustard/20 items-center justify-center">
                    <Zap color="#E8A33D" size={20} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-heading text-espresso text-xs">Lapis 1: DSP On-Device</Text>
                      <View className="bg-olive/20 px-2 py-0.5 rounded-md">
                        <Text className="text-olive text-[9px] font-bold">0ms INSTAN</Text>
                      </View>
                    </View>
                    <Text className="font-body text-text-muted text-[11px] mt-0.5">
                      Urgent Score: <Text className="font-bold text-espresso">{dspResult?.urgencyScore}%</Text> • Jeda Napas: <Text className="font-bold text-espresso">{dspResult?.silenceGaps}x</Text>
                    </Text>
                  </View>
                </View>
                <Text className={`font-display text-sm ${dspResult && dspResult.isHighUrgency ? 'text-warning' : 'text-olive'}`}>
                  {dspResult?.urgencyScore}%
                </Text>
              </View>

              {/* LAYER 2: CLOUD AI SPECTRAL CARD */}
              <View className="bg-surface rounded-2xl p-4 border border-espresso/10 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className={`w-10 h-10 rounded-full ${isOfflineMode ? 'bg-espresso/10' : 'bg-terracotta/20'} items-center justify-center`}>
                    {isOfflineMode ? <CloudOff color="#3E2E22" size={20} opacity={0.6} /> : <Cloud color="#C1592E" size={20} />}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-heading text-espresso text-xs">Lapis 2: Spektral Cloud AI</Text>
                      {isOfflineMode ? (
                        <View className="bg-espresso/10 px-2 py-0.5 rounded-md">
                          <Text className="text-espresso/60 text-[9px] font-bold">MODE OFFLINE</Text>
                        </View>
                      ) : (
                        <View className="bg-mustard/20 px-2 py-0.5 rounded-md">
                          <Text className="text-mustard text-[9px] font-bold">TERHUBUNG</Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-body text-text-muted text-[11px] mt-0.5">
                      {isOfflineMode 
                        ? 'Sinyal terbatas. Memakai proteksi lokal.' 
                        : cloudScore !== null 
                        ? `Probabilitas AI: ${cloudScore}%`
                        : 'Memproses spektral vokal...'}
                    </Text>
                  </View>
                </View>
                {cloudScore !== null ? (
                  <Text className={`font-display text-sm ${cloudScore >= 60 ? 'text-warning' : 'text-olive'}`}>
                    {cloudScore}%
                  </Text>
                ) : (
                  <Text className="font-body text-espresso/40 text-xs">—</Text>
                )}
              </View>

            </View>

            {/* PANIC MODE SHORTCUT */}
            {finalCombinedScore >= 60 && (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => setShowPanicMode(true)}
                className="bg-espresso rounded-2xl py-4 px-5 flex-row items-center justify-between mb-4 shadow-sm"
              >
                <View className="flex-row items-center gap-3">
                  <HeartPulse color="#E8A33D" size={24} />
                  <View>
                    <Text className="text-cream font-heading text-sm">Mulai Panik?</Text>
                    <Text className="text-cream/70 font-body text-xs mt-0.5">Aktifkan Mode Tenang untuk rileks</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setScanState('idle')}
              className="mt-2 py-3 items-center"
            >
              <Text className="text-text-muted font-heading text-xs">Pindai Ulang</Text>
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
            <Text className="text-white text-3xl font-heading mb-12 text-center">Jangan Panik.</Text>

            <View className="relative items-center justify-center w-64 h-64 mb-16">
              <Animated.View className="absolute w-56 h-56 rounded-full border-4 border-olive/30 bg-olive/10" style={animatedBreath} />
              <Animated.View className="absolute w-40 h-40 rounded-full border-4 border-olive/50 bg-olive/20" style={[animatedBreath, { animationDelay: '200ms' }]} />
              <View className="w-32 h-32 rounded-full bg-olive items-center justify-center shadow-lg">
                <Text className="text-white font-display text-4xl">{countdown}s</Text>
              </View>
            </View>

            <Text className="text-white/80 font-body text-lg text-center px-4 leading-relaxed mb-2">
              Tarik napas panjang... dan hembuskan perlahan.
            </Text>
            <Text className="text-white/60 font-body text-sm text-center px-6 leading-relaxed">
              Penipu sengaja membuatmu terburu-buru. Waktu berpihak padamu. Jangan bertindak sebelum menghubungi keluarga.
            </Text>
          </View>

          <View className="gap-3">
            <Text className="text-white/50 text-xs font-display text-center uppercase tracking-widest mb-2">Hubungi Darurat Sekarang</Text>
            {FAMILY_MEMBERS.slice(0, 2).map((member) => (
              <TouchableOpacity key={member.id} activeOpacity={0.8} className="bg-white/10 rounded-2xl p-4 flex-row items-center justify-between border border-white/5">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-mustard items-center justify-center">
                    <Text className="text-espresso font-display text-xl">{member.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-heading text-base">{member.name}</Text>
                    <Text className="text-white/50 font-body text-xs">{member.role}</Text>
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
